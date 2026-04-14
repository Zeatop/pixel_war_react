import { Request, Response, Router } from "express";
import {
    createGrid,
    getAllFrames,
    getFrame,
    NotFoundError,
    ValidationError,
} from "../services/gridService";

const pixelWarRouter = Router();

pixelWarRouter.post("/createGrid", async (req: Request, res: Response) => {
    try {
        const createdGrid = await createGrid(req.body);
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

export default pixelWarRouter;
