/**
 * AI Request Caching Utility
 * Provides stable hashing and TTL-based localStorage caching for AI requests
 */

const CACHE_PREFIX = "claritycast_cache_v1:";
const DEV_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const PROD_TTL_MS = 60 * 60 * 1000; // 1 hour

// Dynamic TTL based on environment
const isDev = process.env.NODE_ENV === "development";
const DEFAULT_TTL_MS = isDev ? DEV_TTL_MS : PROD_TTL_MS;

interface CachedEntry {
    ts: number;
    data: any;
}

/**
 * Create a stable hash from an object by sorting keys
 */
export async function stableHash(obj: any): Promise<string> {
    // Sort object keys recursively for stable hashing
    const sortedObj = sortObjectKeys(obj);
    const jsonStr = JSON.stringify(sortedObj);

    // Use crypto.subtle.digest for SHA-256
    const encoder = new TextEncoder();
    const data = encoder.encode(jsonStr);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Recursively sort object keys for stable stringification
 */
function sortObjectKeys(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map(sortObjectKeys);
    }

    const sorted: any = {};
    Object.keys(obj).sort().forEach(key => {
        sorted[key] = sortObjectKeys(obj[key]);
    });
    return sorted;
}

/**
 * Get cached result if it exists and hasn't expired
 */
export function getCachedResult(cacheKey: string): CachedEntry | null {
    try {
        const fullKey = CACHE_PREFIX + cacheKey;
        const cached = localStorage.getItem(fullKey);

        if (!cached) {
            return null;
        }

        const entry: CachedEntry = JSON.parse(cached);
        const now = Date.now();

        // Check if expired
        if (now - entry.ts > DEFAULT_TTL_MS) {
            localStorage.removeItem(fullKey);
            return null;
        }

        return entry;
    } catch (error) {
        console.warn("Cache read error:", error);
        return null;
    }
}

/**
 * Set cached result with timestamp
 */
export function setCachedResult(cacheKey: string, data: any, ttlMs: number = DEFAULT_TTL_MS): void {
    try {
        const fullKey = CACHE_PREFIX + cacheKey;
        const entry: CachedEntry = {
            ts: Date.now(),
            data
        };
        localStorage.setItem(fullKey, JSON.stringify(entry));
    } catch (error) {
        console.warn("Cache write error:", error);
    }
}

/**
 * Clear all expired cache entries
 */
export function clearExpiredCache(): void {
    try {
        const now = Date.now();
        const keysToRemove: string[] = [];

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(CACHE_PREFIX)) {
                const cached = localStorage.getItem(key);
                if (cached) {
                    try {
                        const entry: CachedEntry = JSON.parse(cached);
                        if (now - entry.ts > DEFAULT_TTL_MS) {
                            keysToRemove.push(key);
                        }
                    } catch (e) {
                        keysToRemove.push(key);
                    }
                }
            }
        }

        keysToRemove.forEach(key => localStorage.removeItem(key));

        if (keysToRemove.length > 0) {
            console.log(`Cleared ${keysToRemove.length} expired cache entries`);
        }
    } catch (error) {
        console.warn("Cache cleanup error:", error);
    }
}

/**
 * Clear all cache entries (for testing/debugging)
 */
export function clearAllCache(): void {
    try {
        const keysToRemove: string[] = [];

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(CACHE_PREFIX)) {
                keysToRemove.push(key);
            }
        }

        keysToRemove.forEach(key => localStorage.removeItem(key));
        console.log(`Cleared ${keysToRemove.length} cache entries`);
    } catch (error) {
        console.warn("Cache clear error:", error);
    }
}
