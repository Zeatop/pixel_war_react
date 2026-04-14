import {Request, Response, Router} from "express";
import {AuthError, loginWithGoogle} from "../services/authService";
import {requireAuth} from "../middlewares/authMiddleware";

const authRouter = Router();

authRouter.post("/google", async (req: Request, res: Response) => {
    try {
        const credential = req.body?.credential;
        const result = await loginWithGoogle(credential);
        res.json(result);
    } catch (error: unknown) {
        if (error instanceof AuthError) {
            res.status(400).json({ error: error.message });
            return;
        }

        const message = error instanceof Error ? error.message : "Erreur interne";
        res.status(500).json({ error: message });
    }
});

authRouter.get("/me", requireAuth, (req: Request, res: Response) => {
    res.json({ user: req.user });
});

export default authRouter;

