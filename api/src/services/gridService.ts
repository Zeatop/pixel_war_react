import pool from "../db/pool";

export type CreateGridPayload = {
    width: number;
    height: number;
    name?: string;
};

export type Grid = {
    id: number;
    name: string | null;
    width: number;
    height: number;
    createdAt: string;
};

export type Frame = {
    id: number;
    gridId: number;
    x: number;
    y: number;
    color: string;
    createdAt: string;
};

export class ValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ValidationError";
    }
}

export class NotFoundError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "NotFoundError";
    }
}

function assertPositiveInt(value: unknown, label: string): number {
    if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
        throw new ValidationError(`${label} doit etre un entier strictement positif`);
    }

    return value;
}

function assertInt(value: unknown, label: string): number {
    if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
        throw new ValidationError(`${label} doit etre un entier positif`);
    }

    return value;
}

function mapGrid(row: Record<string, unknown>): Grid {
    return {
        id: Number(row.id),
        name: (row.name as string | null) ?? null,
        width: Number(row.width),
        height: Number(row.height),
        createdAt: String(row.created_at),
    };
}

function mapFrame(row: Record<string, unknown>): Frame {
    return {
        id: Number(row.id),
        gridId: Number(row.grid_id),
        x: Number(row.x),
        y: Number(row.y),
        color: String(row.color),
        createdAt: String(row.created_at),
    };
}

export async function createGrid(payload: Partial<CreateGridPayload>): Promise<{ grid: Grid; frames: Frame[] }> {
    const width = assertPositiveInt(payload.width, "width");
    const height = assertPositiveInt(payload.height, "height");
    const name = typeof payload.name === "string" && payload.name.trim().length > 0 ? payload.name.trim() : null;

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const gridResult = await client.query(
            "INSERT INTO grids(name, width, height) VALUES ($1, $2, $3) RETURNING *",
            [name, width, height],
        );
        const grid = mapGrid(gridResult.rows[0]);

        await client.query(
            `
            INSERT INTO frames (grid_id, x, y, color)
            SELECT $1, x, y, '#FFFFFF'
            FROM generate_series(0, $2 - 1) AS x
            CROSS JOIN generate_series(0, $3 - 1) AS y
            `,
            [grid.id, width, height],
        );

        const framesResult = await client.query(
            "SELECT * FROM frames WHERE grid_id = $1 ORDER BY y ASC, x ASC",
            [grid.id],
        );

        await client.query("COMMIT");
        return { grid, frames: framesResult.rows.map(mapFrame) };
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}

export async function getAllFrames(gridIdRaw: unknown): Promise<{ grid: Grid; frames: Frame[] }> {
    const gridId = assertPositiveInt(gridIdRaw, "gridId");

    const gridResult = await pool.query("SELECT * FROM grids WHERE id = $1", [gridId]);
    if (gridResult.rowCount === 0) {
        throw new NotFoundError("Grid introuvable");
    }

    const framesResult = await pool.query(
        "SELECT * FROM frames WHERE grid_id = $1 ORDER BY y ASC, x ASC",
        [gridId],
    );

    return {
        grid: mapGrid(gridResult.rows[0]),
        frames: framesResult.rows.map(mapFrame),
    };
}

export async function getFrame(gridIdRaw: unknown, xRaw: unknown, yRaw: unknown): Promise<Frame> {
    const gridId = assertPositiveInt(gridIdRaw, "gridId");
    const x = assertInt(xRaw, "x");
    const y = assertInt(yRaw, "y");

    const frameResult = await pool.query(
        "SELECT * FROM frames WHERE grid_id = $1 AND x = $2 AND y = $3",
        [gridId, x, y],
    );

    if (frameResult.rowCount === 0) {
        throw new NotFoundError("Frame introuvable pour ces coordonnees");
    }

    return mapFrame(frameResult.rows[0]);
}

