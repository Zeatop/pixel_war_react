import {Pool} from "pg";

const pool = new Pool({
    host: process.env.POSTGRES_HOST || "localhost",
    port: process.env.POSTGRES_PORT ? Number(process.env.POSTGRES_PORT) : 5432,
    database: process.env.POSTGRES_DB || "pixel_war",
    user: process.env.POSTGRES_USER || "pixelUser",
    password: process.env.POSTGRES_PASSWORD || "pixelMDP",
});

export default pool;

