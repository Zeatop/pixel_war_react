import {Request, Response, Router} from "express";
import pixelWarRouter from "./routes/pixelWarRoutes";
import authRouter from "./routes/authRoutes";

const apiRouter = Router();

apiRouter.get("/", (_req: Request, res: Response) => {
    res.json({
        name: "pixel-war-api",
        version: "2.0",
        endpoints: [
            "POST /api/createGrid",
            "GET /api/getAllFrames/:gridId",
            "GET /api/getFrame/:gridId/:x/:y",
            "POST /api/auth/google",
            "GET /api/boards",
            "GET /api/boards/:id/state",
            "POST /api/boards/:id/pixels",
        ],
    });
});

apiRouter.use("/auth", authRouter);
apiRouter.use(pixelWarRouter);

export default apiRouter;
