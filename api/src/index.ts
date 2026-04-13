import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT ? Number(process.env.PORT) : 8000;

const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (_req, res) => {
    res.json({ status: "ok", port: PORT });
});

// Example API route
app.get("/api/example", (_req, res) => {
    res.json({ message: "Hello from the API on port 8000" });
});

app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`API server listening on port ${PORT}`);
});