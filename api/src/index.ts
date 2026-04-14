import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import apiRouter from "./api";
import { initDb } from "./db/initDb";

dotenv.config();

const PORT = process.env.PORT ? Number(process.env.PORT) : 8000;

const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (_req: Request, res: Response) => {
    res.json({ status: "ok", port: PORT });
});

app.use("/api", apiRouter);

async function startServer(): Promise<void> {
    try {
        await initDb();
        app.listen(PORT, () => {
            // eslint-disable-next-line no-console
            console.log(`API server listening on port ${PORT}`);
        });
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Impossible de demarrer l'API:", error);
        process.exit(1);
    }
}

void startServer();
