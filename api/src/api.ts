import { Request, Response, Router } from "express";
import pixelWarRouter from "./routes/pixelWarRoutes";

const apiRouter = Router();

apiRouter.get("/", (_req: Request, res: Response) => {
    res.json({
        name: "pixel-war-api",
        version: "2.0",
        endpoints: [
            "POST /api/createGrid",
            "GET /api/getAllFrames/:gridId",
            "GET /api/getFrame/:gridId/:x/:y",
        ],
    });
});

apiRouter.use(pixelWarRouter);

export default apiRouter;
