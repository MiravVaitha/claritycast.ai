const WINDOW_MS = (parseInt(process.env.RATE_LIMIT_WINDOW_S || "60", 10)) * 1000;
const MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX || "10", 10);

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

// Use globalThis to persist across hot reloads (dev) and warm invocations (serverless)
const globalStore = globalThis as typeof globalThis & { __rateLimitStore?: Map<string, RateLimitEntry> };
if (!globalStore.__rateLimitStore) {
    globalStore.__rateLimitStore = new Map<string, RateLimitEntry>();
}
const store = globalStore.__rateLimitStore;

// Clean up expired entries every 5 minutes
const globalCleanup = globalThis as typeof globalThis & { __rateLimitCleanup?: boolean };
if (!globalCleanup.__rateLimitCleanup) {
    globalCleanup.__rateLimitCleanup = true;
    setInterval(() => {
        const now = Date.now();
        for (const [key, entry] of store) {
            if (now >= entry.resetTime) {
                store.delete(key);
            }
        }
    }, 5 * 60 * 1000);
}

export function rateLimit(ip: string): { allowed: boolean; remaining: number; retryAfterSeconds: number } {
    const now = Date.now();
    const entry = store.get(ip);

    if (!entry || now >= entry.resetTime) {
        store.set(ip, { count: 1, resetTime: now + WINDOW_MS });
        return { allowed: true, remaining: MAX_REQUESTS - 1, retryAfterSeconds: 0 };
    }

    entry.count++;

    if (entry.count > MAX_REQUESTS) {
        const retryAfterSeconds = Math.ceil((entry.resetTime - now) / 1000);
        return { allowed: false, remaining: 0, retryAfterSeconds };
    }

    return { allowed: true, remaining: MAX_REQUESTS - entry.count, retryAfterSeconds: 0 };
}
