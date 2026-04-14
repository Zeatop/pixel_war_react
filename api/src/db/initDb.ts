import pool from "./pool";

export async function initDb(): Promise<void> {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS grids (
            id SERIAL PRIMARY KEY,
            name TEXT,
            width INTEGER NOT NULL CHECK (width > 0),
            height INTEGER NOT NULL CHECK (height > 0),
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS frames (
            id SERIAL PRIMARY KEY,
            grid_id INTEGER NOT NULL REFERENCES grids(id) ON DELETE CASCADE,
            x INTEGER NOT NULL,
            y INTEGER NOT NULL,
            color VARCHAR(7) NOT NULL DEFAULT '#FFFFFF',
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            UNIQUE (grid_id, x, y)
        );
    `);
}

