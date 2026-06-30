import { NextResponse } from "next/server";

// Comma-separated list of allowed origins, e.g.:
//   ALLOWED_ORIGINS=https://claritycast.ai,https://www.claritycast.ai
// If empty (typical local dev), the Origin check is skipped so localhost works.
// MUST be set in production.
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);

// Returns the trusted client IP for rate-limiting purposes.
// Vercel sets x-vercel-forwarded-for which the platform rewrites at the edge,
// so clients cannot forge it. Naive use of the first entry of x-forwarded-for
// is client-controllable and is a known rate-limit bypass.
export function getClientIp(req: Request): string {
    const vercel = req.headers.get("x-vercel-forwarded-for");
    if (vercel) return vercel.split(",")[0].trim();

    const realIp = req.headers.get("x-real-ip");
    if (realIp) return realIp.trim();

    // Fallback for non-Vercel deployments: take the LAST entry of XFF,
    // which is the closest trusted proxy's view of the source.
    const xff = req.headers.get("x-forwarded-for");
    if (xff) {
        const parts = xff.split(",").map(s => s.trim()).filter(Boolean);
        if (parts.length > 0) return parts[parts.length - 1];
    }

    return "unknown";
}

// Validates the request is well-formed and originates from an allowed site.
// Returns null on success, or a NextResponse to return on failure.
export function validateRequestSecurity(req: Request): NextResponse | null {
    const ct = (req.headers.get("content-type") || "").toLowerCase();
    if (!ct.startsWith("application/json")) {
        return NextResponse.json(
            { errorType: "INVALID_INPUT", message: "Content-Type must be application/json" },
            { status: 415 }
        );
    }

    if (ALLOWED_ORIGINS.length > 0) {
        const origin = req.headers.get("origin");
        if (!origin || !ALLOWED_ORIGINS.includes(origin)) {
            return NextResponse.json(
                { errorType: "FORBIDDEN", message: "Origin not allowed" },
                { status: 403 }
            );
        }
    }

    return null;
}
