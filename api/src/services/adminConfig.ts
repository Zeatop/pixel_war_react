import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

let cachedAdminEmails: string[] | null = null;

function parseAdminYml(content: string): string[] {
    return content
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.startsWith("- "))
        .map((line) => line.slice(2).trim().toLowerCase())
        .filter(Boolean);
}

export function getAdminEmails(): string[] {
    if (cachedAdminEmails) return cachedAdminEmails;

    // Try admin.yml file first
    const paths = [
        resolve(process.cwd(), "admin.yml"),
        resolve(__dirname, "../../admin.yml"),
        resolve(__dirname, "../../../admin.yml"),
    ];

    for (const filePath of paths) {
        if (existsSync(filePath)) {
            try {
                const content = readFileSync(filePath, "utf-8");
                cachedAdminEmails = parseAdminYml(content);
                if (cachedAdminEmails.length > 0) return cachedAdminEmails;
            } catch { /* ignore read errors */ }
        }
    }

    // Fallback to env var
    const envEmails = process.env.ADMIN_EMAIL;
    if (envEmails) {
        cachedAdminEmails = envEmails.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
        return cachedAdminEmails;
    }

    cachedAdminEmails = [];
    return cachedAdminEmails;
}
