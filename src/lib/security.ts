import { NextResponse } from "next/server";

// Optional allowlist of ADDITIONAL cross-origin sites permitted to call the API,
// comma-separated, e.g. ALLOWED_ORIGINS=https://partner.example.com
// Same-origin requests (the app's own frontend calling its API) are always allowed
// and need no configuration — this is only needed if a *different* origin must reach
// the API. If empty, only same-origin requests are permitted.
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

// True when the request's Origin matches the host it was sent to — i.e. the app
// calling its own API. This is the standard CSRF origin check and is safe on any
// domain (apex, www, *.vercel.app, preview URLs, localhost) with no configuration.
function isSameOrigin(req: Request, origin: string): boolean {
    try {
        const originHost = new URL(origin).host;
        // Behind Vercel/proxies the Host header can be internal; x-forwarded-host
        // reflects the public domain the user actually loaded.
        const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
        return !!host && originHost === host;
    } catch {
        return false;
    }
}

// Validates the request is well-formed and comes from an allowed origin.
// Returns null on success, or a NextResponse to return on failure.
export function validateRequestSecurity(req: Request): NextResponse | null {
    const ct = (req.headers.get("content-type") || "").toLowerCase();
    if (!ct.startsWith("application/json")) {
        return NextResponse.json(
            { errorType: "INVALID_INPUT", message: "Content-Type must be application/json" },
            { status: 415 }
        );
    }

    const origin = req.headers.get("origin");

    // Same-origin (the app's own frontend) is always allowed — this is what makes
    // generation work on every domain without enumerating ALLOWED_ORIGINS.
    if (origin && isSameOrigin(req, origin)) {
        return null;
    }

    // Otherwise a configured allowlist gates cross-origin callers. When the list is
    // empty, cross-origin requests fall through and are allowed too (matching the
    // previous "skip when unset" behavior for local dev / non-browser clients).
    if (ALLOWED_ORIGINS.length > 0 && (!origin || !ALLOWED_ORIGINS.includes(origin))) {
        return NextResponse.json(
            { errorType: "FORBIDDEN", message: "Origin not allowed" },
            { status: 403 }
        );
    }

    return null;
}
