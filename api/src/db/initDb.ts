import pool from "./pool";

export async function initDb(): Promise<void> {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            google_sub TEXT NOT NULL UNIQUE,
            email TEXT NOT NULL UNIQUE,
            name TEXT NOT NULL,
            avatar_url TEXT,
            is_admin BOOLEAN NOT NULL DEFAULT FALSE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS grids (
            id SERIAL PRIMARY KEY,
            name TEXT,
            width INTEGER NOT NULL CHECK (width > 0),
            height INTEGER NOT NULL CHECK (height > 0),
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            ends_at TIMESTAMPTZ,
            status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'finished')),
            allow_overwrite BOOLEAN NOT NULL DEFAULT TRUE,
            cooldown_seconds INTEGER NOT NULL DEFAULT 30 CHECK (cooldown_seconds >= 0),
            author_id INTEGER REFERENCES users(id) ON DELETE SET NULL
        );
    `);

    await pool.query("ALTER TABLE grids ADD COLUMN IF NOT EXISTS ends_at TIMESTAMPTZ");
    await pool.query("ALTER TABLE grids ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'in_progress'");
    await pool.query("ALTER TABLE grids ADD COLUMN IF NOT EXISTS allow_overwrite BOOLEAN NOT NULL DEFAULT TRUE");
    await pool.query("ALTER TABLE grids ADD COLUMN IF NOT EXISTS cooldown_seconds INTEGER NOT NULL DEFAULT 30");
    await pool.query("ALTER TABLE grids ADD COLUMN IF NOT EXISTS author_id INTEGER REFERENCES users(id) ON DELETE SET NULL");

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

    await pool.query(`
        CREATE TABLE IF NOT EXISTS pixel_placements (
            id SERIAL PRIMARY KEY,
            grid_id INTEGER NOT NULL REFERENCES grids(id) ON DELETE CASCADE,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            x INTEGER NOT NULL,
            y INTEGER NOT NULL,
            color VARCHAR(7) NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
    `);

    await pool.query("CREATE INDEX IF NOT EXISTS idx_pixel_placements_grid_user_created_at ON pixel_placements (grid_id, user_id, created_at DESC)");

    // Seed admin users by email if configured (comma-separated)
    const adminEmails = process.env.ADMIN_EMAIL;
    if (adminEmails) {
        const emails = adminEmails.split(",").map((e) => e.trim()).filter(Boolean);
        for (const email of emails) {
            await pool.query(
                `UPDATE users SET is_admin = TRUE WHERE email = $1 AND is_admin = FALSE`,
                [email],
            );
        }
    }
}

