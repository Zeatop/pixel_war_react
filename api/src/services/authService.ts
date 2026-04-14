import jwt, {type SignOptions} from "jsonwebtoken";
import pool from "../db/pool";

const GOOGLE_TOKENINFO_URL = "https://oauth2.googleapis.com/tokeninfo";
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN ?? "7d") as SignOptions["expiresIn"];

type GoogleUserInfo = {
    sub: string;
    email: string;
    name: string;
    picture?: string;
    aud: string;
    email_verified?: string;
};

export type AuthUser = {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    isAdmin: boolean;
};

export class AuthError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "AuthError";
    }
}

function mapUserRow(row: Record<string, unknown>): AuthUser {
    return {
        id: Number(row.id),
        name: String(row.name),
        email: String(row.email),
        avatar: (row.avatar_url as string | null) ?? undefined,
        isAdmin: Boolean(row.is_admin),
    };
}

async function fetchGoogleUserInfo(credential: string): Promise<GoogleUserInfo> {
    const response = await fetch(`${GOOGLE_TOKENINFO_URL}?id_token=${encodeURIComponent(credential)}`);
    if (!response.ok) {
        throw new AuthError("Token Google invalide");
    }

    const data = (await response.json()) as Partial<GoogleUserInfo>;

    if (!data.sub || !data.email || !data.name || !data.aud) {
        throw new AuthError("Token Google incomplet");
    }

    if (data.email_verified !== undefined && data.email_verified !== "true") {
        throw new AuthError("Email Google non verifie");
    }

    const allowedClientId = process.env.GOOGLE_CLIENT_ID;
    if (allowedClientId && data.aud !== allowedClientId) {
        throw new AuthError("Client Google non autorise");
    }

    return data as GoogleUserInfo;
}

export function signJwt(payload: { userId: number; email: string }): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyJwt(token: string): { userId: number; email: string } {
    return jwt.verify(token, JWT_SECRET) as { userId: number; email: string };
}

export async function loginWithGoogle(credentialRaw: unknown): Promise<{ user: AuthUser; token: string }> {
    if (typeof credentialRaw !== "string" || credentialRaw.trim().length === 0) {
        throw new AuthError("credential Google requis");
    }

    const googleUser = await fetchGoogleUserInfo(credentialRaw.trim());

    const result = await pool.query(
        `
        INSERT INTO users (google_sub, email, name, avatar_url, updated_at)
        VALUES ($1, $2, $3, $4, NOW())
        ON CONFLICT (google_sub)
        DO UPDATE SET
            email = EXCLUDED.email,
            name = EXCLUDED.name,
            avatar_url = EXCLUDED.avatar_url,
            updated_at = NOW()
        RETURNING id, name, email, avatar_url, is_admin
        `,
        [googleUser.sub, googleUser.email, googleUser.name, googleUser.picture ?? null],
    );

    const user = mapUserRow(result.rows[0]);
    const token = signJwt({ userId: user.id, email: user.email });

    return { user, token };
}

export async function getUserById(userId: number): Promise<AuthUser | null> {
    const result = await pool.query("SELECT id, name, email, avatar_url, is_admin FROM users WHERE id = $1", [userId]);
    if (result.rowCount === 0) {
        return null;
    }

    return mapUserRow(result.rows[0]);
}

