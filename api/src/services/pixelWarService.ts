type PlacePixelPayload = {
    x: number;
    y: number;
    color: string;
    userId: string;
};

type Pixel = {
    x: number;
    y: number;
    color: string;
    userId: string;
    placedAt: string;
};

type LeaderboardEntry = {
    userId: string;
    score: number;
};

const BOARD_WIDTH = process.env.BOARD_WIDTH ? Number(process.env.BOARD_WIDTH) : 50;
const BOARD_HEIGHT = process.env.BOARD_HEIGHT ? Number(process.env.BOARD_HEIGHT) : 50;

const HEX_COLOR_REGEX = /^#[0-9a-fA-F]{6}$/;

const grid = new Map<string, Pixel>();
const scoreByUser = new Map<string, number>();

export class ValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ValidationError";
    }
}

function getPixelKey(x: number, y: number): string {
    return `${x}:${y}`;
}

function parsePlacePixelPayload(payload: Partial<PlacePixelPayload>): PlacePixelPayload {
    const { x, y, color, userId } = payload;

    if (typeof x !== "number" || !Number.isInteger(x) || typeof y !== "number" || !Number.isInteger(y)) {
        throw new ValidationError("x et y doivent etre des entiers");
    }

    if (x < 0 || x >= BOARD_WIDTH || y < 0 || y >= BOARD_HEIGHT) {
        throw new ValidationError(`Coordonnees hors limite (0-${BOARD_WIDTH - 1}, 0-${BOARD_HEIGHT - 1})`);
    }

    if (typeof color !== "string" || !HEX_COLOR_REGEX.test(color)) {
        throw new ValidationError("color doit etre une couleur hexadecimale (#RRGGBB)");
    }

    if (typeof userId !== "string" || userId.trim().length === 0) {
        throw new ValidationError("userId est requis");
    }

    return {
        x,
        y,
        color,
        userId: userId.trim(),
    };
}

export function placePixel(payload: Partial<PlacePixelPayload>): Pixel {
    const validPayload = parsePlacePixelPayload(payload);

    const pixel: Pixel = {
        x: validPayload.x,
        y: validPayload.y,
        color: validPayload.color,
        userId: validPayload.userId,
        placedAt: new Date().toISOString(),
    };

    grid.set(getPixelKey(pixel.x, pixel.y), pixel);
    scoreByUser.set(pixel.userId, (scoreByUser.get(pixel.userId) ?? 0) + 1);

    return pixel;
}

export function getGrid(): { width: number; height: number; pixels: Pixel[] } {
    return {
        width: BOARD_WIDTH,
        height: BOARD_HEIGHT,
        pixels: Array.from(grid.values()),
    };
}

export function getLeaderboard(limit = 10): LeaderboardEntry[] {
    return Array.from(scoreByUser.entries())
        .map(([userId, score]) => ({ userId, score }))
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
}

