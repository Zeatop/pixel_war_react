import {Request, Response, Router} from "express";
import pool from "../db/pool";
import {
    ConflictError,
    createGrid,
    getAllFrames,
    getBoardState,
    getFrame,
    listBoards,
    NotFoundError,
    placePixel,
    ValidationError,
} from "../services/gridService";
import {optionalAuth, requireAuth} from "../middlewares/authMiddleware";
import {emitBoardEnded, emitPixelPlaced} from "../services/realtimeService";

const pixelWarRouter = Router();

pixelWarRouter.post("/createGrid", optionalAuth, async (req: Request, res: Response) => {
    try {
        const createdGrid = await createGrid({
            ...req.body,
            authorId: req.user?.id,
        });
        res.status(201).json(createdGrid);
    } catch (error: unknown) {
        if (error instanceof ValidationError) {
            res.status(400).json({ error: error.message });
            return;
        }

        const message = error instanceof Error ? error.message : "Erreur interne";
        res.status(500).json({ error: message });
    }
});

pixelWarRouter.get("/boards", async (req: Request, res: Response) => {
    try {
        const statusRaw = req.query.status;
        const status = statusRaw === "in_progress" || statusRaw === "finished" ? statusRaw : undefined;
        const boards = await listBoards(status);
        res.json({ boards });
    } catch (error: unknown) {
        if (error instanceof ValidationError) {
            res.status(400).json({ error: error.message });
            return;
        }

        const message = error instanceof Error ? error.message : "Erreur interne";
        res.status(500).json({ error: message });
    }
});

pixelWarRouter.get("/boards/:gridId/state", async (req: Request, res: Response) => {
    try {
        const state = await getBoardState(Number(req.params.gridId));
        res.json(state);
    } catch (error: unknown) {
        if (error instanceof ValidationError) {
            res.status(400).json({ error: error.message });
            return;
        }

        if (error instanceof NotFoundError) {
            res.status(404).json({ error: error.message });
            return;
        }

        const message = error instanceof Error ? error.message : "Erreur interne";
        res.status(500).json({ error: message });
    }
});

pixelWarRouter.post("/boards/:gridId/pixels", requireAuth, async (req: Request, res: Response) => {
    try {
        const placedPixel = await placePixel(Number(req.params.gridId), req.user!, req.body);
        emitPixelPlaced(placedPixel);
        res.status(201).json(placedPixel);
    } catch (error: unknown) {
        if (error instanceof ValidationError) {
            res.status(400).json({ error: error.message });
            return;
        }

        if (error instanceof NotFoundError) {
            res.status(404).json({ error: error.message });
            return;
        }

        if (error instanceof ConflictError) {
            const isBoardEnded = error.message.includes("termine") || error.message.includes("date de fin");
            if (isBoardEnded) {
                emitBoardEnded(Number(req.params.gridId));
            }

            res.status(409).json({ error: error.message, retryAfterSeconds: error.retryAfterSeconds ?? null });
            return;
        }

        const message = error instanceof Error ? error.message : "Erreur interne";
        res.status(500).json({ error: message });
    }
});

pixelWarRouter.get("/getAllFrames/:gridId", async (req: Request, res: Response) => {
    try {
        const data = await getAllFrames(Number(req.params.gridId));
        res.json(data);
    } catch (error: unknown) {
        if (error instanceof ValidationError) {
            res.status(400).json({ error: error.message });
            return;
        }

        if (error instanceof NotFoundError) {
            res.status(404).json({ error: error.message });
            return;
        }

        const message = error instanceof Error ? error.message : "Erreur interne";
        res.status(500).json({ error: message });
    }
});

pixelWarRouter.get("/getFrame/:gridId/:x/:y", async (req: Request, res: Response) => {
    try {
        const frame = await getFrame(
            Number(req.params.gridId),
            Number(req.params.x),
            Number(req.params.y),
        );

        res.json(frame);
    } catch (error: unknown) {
        if (error instanceof ValidationError) {
            res.status(400).json({ error: error.message });
            return;
        }

        if (error instanceof NotFoundError) {
            res.status(404).json({ error: error.message });
            return;
        }

        const message = error instanceof Error ? error.message : "Erreur interne";
        res.status(500).json({ error: message });
    }
});

// Stats globales (nombre d'utilisateurs + nombre de boards)
pixelWarRouter.get("/stats", async (_req: Request, res: Response) => {
    try {
        const usersResult = await pool.query("SELECT COUNT(*) FROM users");
        const boardsResult = await pool.query("SELECT COUNT(*) FROM grids");
        res.json({
            totalUsers: Number(usersResult.rows[0].count),
            totalBoards: Number(boardsResult.rows[0].count),
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Erreur interne";
        res.status(500).json({ error: message });
    }
});

// Contributions d'un utilisateur
pixelWarRouter.get("/users/:userId/contributions", requireAuth, async (req: Request, res: Response) => {
    try {
        const userId = Number(req.params.userId);
        const result = await pool.query(
            `SELECT pp.grid_id, g.name AS board_name, g.width, g.height, g.status,
                    COUNT(*)::int AS pixel_count,
                    MAX(pp.created_at) AS last_placed_at
             FROM pixel_placements pp
             JOIN grids g ON g.id = pp.grid_id
             WHERE pp.user_id = $1
             GROUP BY pp.grid_id, g.name, g.width, g.height, g.status
             ORDER BY last_placed_at DESC`,
            [userId],
        );
        res.json({ contributions: result.rows });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Erreur interne";
        res.status(500).json({ error: message });
    }
});

export default pixelWarRouter;
