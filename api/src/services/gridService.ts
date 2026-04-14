import pool from "../db/pool";

export type CreateGridPayload = {
    width: number;
    height: number;
    name?: string;
    endsAt?: string;
    allowOverwrite?: boolean;
    cooldownSeconds?: number;
    authorId?: number;
};

export type Grid = {
    id: number;
    name: string | null;
    width: number;
    height: number;
    createdAt: string;
    endsAt: string | null;
    status: "in_progress" | "finished";
    allowOverwrite: boolean;
    cooldownSeconds: number;
    authorId: number | null;
};

export type Frame = {
    id: number;
    gridId: number;
    x: number;
    y: number;
    color: string;
    createdAt: string;
};

export type PlacePixelPayload = {
    x: number;
    y: number;
    color: string;
};

export type PlacedPixel = {
    gridId: number;
    x: number;
    y: number;
    color: string;
    placedAt: string;
    user: {
        id: number;
        name: string;
        email: string;
        avatar?: string;
    };
};

const HEX_COLOR_REGEX = /^#[0-9A-F]{6}$/;
const DEFAULT_COOLDOWN_SECONDS = 30;
const EMPTY_COLOR = "#FFFFFF";
const ALLOWED_COLORS = new Set([
    "#1A1A1A", "#FFFFFF", "#888888", "#E63946", "#FF6B6B", "#FF006E", "#F4A261", "#FF9F1C",
    "#E9C46A", "#FFEE32", "#2A9D8F", "#06D6A0", "#38B000", "#606C38", "#457B9D", "#0077B6",
    "#A8DADC", "#7209B7", "#6D6875", "#B5838D", "#8D5524", "#DDA15E", "#FFC8DD", "#CDB4DB",
]);

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

export class ConflictError extends Error {
    retryAfterSeconds?: number;

    constructor(message: string, retryAfterSeconds?: number) {
        super(message);
        this.name = "ConflictError";
        this.retryAfterSeconds = retryAfterSeconds;
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

function assertNonNegativeInt(value: unknown, label: string): number {
    if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
        throw new ValidationError(`${label} doit etre un entier positif ou nul`);
    }

    return value;
}

function normalizeColor(value: unknown): string {
    if (typeof value !== "string") {
        throw new ValidationError("color doit etre une chaine");
    }

    const normalized = value.trim().toUpperCase();
    if (!HEX_COLOR_REGEX.test(normalized)) {
        throw new ValidationError("color doit respecter le format #RRGGBB");
    }

    if (!ALLOWED_COLORS.has(normalized)) {
        throw new ValidationError("color n'est pas autorisee sur ce board");
    }

    return normalized;
}

function parseEndsAt(endsAtRaw?: string): Date | null {
    if (!endsAtRaw) {
        return null;
    }

    const parsed = new Date(endsAtRaw);
    if (Number.isNaN(parsed.getTime())) {
        throw new ValidationError("endsAt doit etre une date ISO valide");
    }

    return parsed;
}

function mapGrid(row: Record<string, unknown>): Grid {
    return {
        id: Number(row.id),
        name: (row.name as string | null) ?? null,
        width: Number(row.width),
        height: Number(row.height),
        createdAt: String(row.created_at),
        endsAt: (row.ends_at as string | null) ?? null,
        status: String(row.status) === "finished" ? "finished" : "in_progress",
        allowOverwrite: Boolean(row.allow_overwrite),
        cooldownSeconds: Number(row.cooldown_seconds),
        authorId: row.author_id === null ? null : Number(row.author_id),
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
    const allowOverwrite = typeof payload.allowOverwrite === "boolean" ? payload.allowOverwrite : true;
    const cooldownSeconds = payload.cooldownSeconds === undefined
        ? DEFAULT_COOLDOWN_SECONDS
        : assertNonNegativeInt(payload.cooldownSeconds, "cooldownSeconds");
    const endsAt = parseEndsAt(payload.endsAt);
    const authorId = payload.authorId === undefined ? null : assertPositiveInt(payload.authorId, "authorId");

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const gridResult = await client.query(
            `
            INSERT INTO grids(name, width, height, ends_at, status, allow_overwrite, cooldown_seconds, author_id)
            VALUES ($1, $2, $3, $4, 'in_progress', $5, $6, $7)
            RETURNING *
            `,
            [name, width, height, endsAt, allowOverwrite, cooldownSeconds, authorId],
        );
        const grid = mapGrid(gridResult.rows[0]);

        await client.query(
            `
            INSERT INTO frames (grid_id, x, y, color)
            SELECT $1, x, y, $4
            FROM generate_series(0, $2 - 1) AS x
            CROSS JOIN generate_series(0, $3 - 1) AS y
            `,
            [grid.id, width, height, EMPTY_COLOR],
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

export async function listBoards(status?: "in_progress" | "finished"): Promise<Grid[]> {
    if (status && status !== "in_progress" && status !== "finished") {
        throw new ValidationError("status invalide");
    }

    const values: unknown[] = [];
    const whereClause = status ? "WHERE status = $1" : "";
    if (status) {
        values.push(status);
    }

    const result = await pool.query(`SELECT * FROM grids ${whereClause} ORDER BY created_at DESC`, values);
    return result.rows.map(mapGrid);
}

export async function getBoardState(gridIdRaw: unknown): Promise<{ grid: Grid; frames: Frame[] }> {
    return getAllFrames(gridIdRaw);
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

function getRemainingCooldownSeconds(lastPlacedAt: Date, cooldownSeconds: number): number {
    const elapsedMs = Date.now() - lastPlacedAt.getTime();
    const remainingMs = cooldownSeconds * 1000 - elapsedMs;
    return Math.max(0, Math.ceil(remainingMs / 1000));
}

export async function placePixel(
    gridIdRaw: unknown,
    user: { id: number; name: string; email: string; avatar?: string },
    payload: Partial<PlacePixelPayload>,
): Promise<PlacedPixel> {
    const gridId = assertPositiveInt(gridIdRaw, "gridId");
    const x = assertInt(payload.x, "x");
    const y = assertInt(payload.y, "y");
    const color = normalizeColor(payload.color);

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const gridResult = await client.query("SELECT * FROM grids WHERE id = $1 FOR UPDATE", [gridId]);
        if (gridResult.rowCount === 0) {
            throw new NotFoundError("Grid introuvable");
        }

        const grid = mapGrid(gridResult.rows[0]);

        if (x >= grid.width || y >= grid.height) {
            throw new ValidationError(`Coordonnees hors limite (0-${grid.width - 1}, 0-${grid.height - 1})`);
        }

        if (grid.status === "finished") {
            throw new ConflictError("Ce board est termine");
        }

        if (grid.endsAt && new Date(grid.endsAt).getTime() <= Date.now()) {
            await client.query("UPDATE grids SET status = 'finished' WHERE id = $1", [gridId]);
            throw new ConflictError("Ce board a atteint sa date de fin");
        }

        if (grid.cooldownSeconds > 0) {
            const cooldownResult = await client.query(
                `
                SELECT created_at
                FROM pixel_placements
                WHERE grid_id = $1 AND user_id = $2
                ORDER BY created_at DESC
                LIMIT 1
                `,
                [gridId, user.id],
            );

            if ((cooldownResult.rowCount ?? 0) > 0) {
                const lastPlacedAt = new Date(String(cooldownResult.rows[0].created_at));
                const remaining = getRemainingCooldownSeconds(lastPlacedAt, grid.cooldownSeconds);
                if (remaining > 0) {
                    throw new ConflictError(`Cooldown en cours: reessaie dans ${remaining}s`, remaining);
                }
            }
        }

        const frameResult = await client.query(
            "SELECT * FROM frames WHERE grid_id = $1 AND x = $2 AND y = $3 FOR UPDATE",
            [gridId, x, y],
        );

        if (frameResult.rowCount === 0) {
            throw new NotFoundError("Frame introuvable pour ces coordonnees");
        }

        const frame = mapFrame(frameResult.rows[0]);
        if (!grid.allowOverwrite && frame.color.toUpperCase() !== EMPTY_COLOR) {
            throw new ConflictError("Ce pixel a deja ete utilise sur ce board");
        }

        const updatedFrameResult = await client.query(
            "UPDATE frames SET color = $1, created_at = NOW() WHERE id = $2 RETURNING *",
            [color, frame.id],
        );

        await client.query(
            "INSERT INTO pixel_placements (grid_id, user_id, x, y, color) VALUES ($1, $2, $3, $4, $5)",
            [gridId, user.id, x, y, color],
        );

        await client.query("COMMIT");

        const updatedFrame = mapFrame(updatedFrameResult.rows[0]);
        return {
            gridId,
            x: updatedFrame.x,
            y: updatedFrame.y,
            color: updatedFrame.color,
            placedAt: updatedFrame.createdAt,
            user,
        };
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}

