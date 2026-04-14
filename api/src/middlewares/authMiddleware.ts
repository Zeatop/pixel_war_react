import { NextFunction, Request, Response } from "express";
import { getUserById, verifyJwt } from "../services/authService";

type RequestUser = {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    isAdmin: boolean;
};

declare global {
    namespace Express {
        interface Request {
            user?: RequestUser;
        }
    }
}

function extractBearerToken(authorizationHeader?: string): string | null {
    if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
        return null;
    }

    const token = authorizationHeader.slice("Bearer ".length).trim();
    return token.length > 0 ? token : null;
}

export async function optionalAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
    try {
        const token = extractBearerToken(req.headers.authorization);
        if (!token) {
            next();
            return;
        }

        const payload = verifyJwt(token);
        const user = await getUserById(payload.userId);
        if (user) {
            req.user = user;
        }

        next();
    } catch (_error) {
        next();
    }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const token = extractBearerToken(req.headers.authorization);
        if (!token) {
            res.status(401).json({ error: "Authentification requise" });
            return;
        }

        const payload = verifyJwt(token);
        const user = await getUserById(payload.userId);
        if (!user) {
            res.status(401).json({ error: "Utilisateur introuvable" });
            return;
        }

        req.user = user;
        next();
    } catch (_error) {
        res.status(401).json({ error: "Token invalide" });
    }
}

