/**
 * Enhanced API client for AI generation requests
 * Supports AbortController for timeouts and automatic retries for transient errors.
 */

export interface APIError extends Error {
    errorType: string;
    status?: number;
    details?: any;
    debug?: any;
    retryAfterSeconds?: number;
}

export interface RequestOptions {
    timeoutMs?: number;
    maxRetries?: number;
    baseDelayMs?: number;
    maxDelayMs?: number;
    onRetry?: (attempt: number, maxRetries: number, delayMs: number) => void;
}

const DEFAULT_TIMEOUT = 60000; // 60s
const DEFAULT_RETRIES = 3;
const DEFAULT_BASE_DELAY = 1000;
const DEFAULT_MAX_DELAY = 30000;

/**
 * Robust fetch wrapper with timeout and exponential backoff retry.
 * Respects Retry-After header and adds random jitter.
 */
export async function apiClient<T>(
    endpoint: string,
    body: any,
    options: RequestOptions = {}
): Promise<T> {
    const {
        timeoutMs = DEFAULT_TIMEOUT,
        maxRetries = DEFAULT_RETRIES,
        baseDelayMs = DEFAULT_BASE_DELAY,
        maxDelayMs = DEFAULT_MAX_DELAY,
        onRetry
    } = options;

    let attempts = 0;

    while (attempts <= maxRetries) {
        attempts++;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        try {
            const response = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            const data = await response.json().catch(() => ({
                errorType: "PARSE_ERROR",
                message: "Server returned invalid JSON response."
            }));

            if (!response.ok) {
                // Determine if we should retry
                const isRetryable = [429, 408, 500, 502, 503, 504].includes(response.status);

                if (isRetryable && attempts <= maxRetries) {
                    // Calculate backoff
                    let delayMs = Math.min(maxDelayMs, baseDelayMs * Math.pow(2, attempts - 1));

                    // Add jitter (±50%)
                    const jitter = 0.5 + Math.random();
                    delayMs = delayMs * jitter;

                    // Respect Retry-After header if present
                    const retryAfter = response.headers.get("Retry-After");
                    if (retryAfter) {
                        const retryAfterSeconds = parseInt(retryAfter, 10);
                        if (!isNaN(retryAfterSeconds)) {
                            delayMs = Math.max(delayMs, retryAfterSeconds * 1000);
                        }
                    }

                    if (onRetry) onRetry(attempts, maxRetries, delayMs);

                    console.warn(`[RETRY] Status ${response.status}. Attempt ${attempts}/${maxRetries}. Waiting ${Math.round(delayMs)}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delayMs));
                    continue;
                }

                // Create a structured error
                const error = new Error(data.message || "Request failed") as APIError;
                error.errorType = data.errorType || "SERVER_ERROR";
                error.status = response.status;
                error.details = data.details;
                error.debug = data.debug;
                error.retryAfterSeconds = data.retryAfterSeconds;
                throw error;
            }

            return data as T;

        } catch (err: any) {
            clearTimeout(timeoutId);

            if (err instanceof Error && err.name === 'AbortError') {
                if (attempts <= maxRetries) {
                    let delayMs = Math.min(maxDelayMs, baseDelayMs * Math.pow(2, attempts - 1));
                    const jitter = 0.5 + Math.random();
                    delayMs = delayMs * jitter;

                    if (onRetry) onRetry(attempts, maxRetries, delayMs);
                    console.warn(`[RETRY] Timeout. Attempt ${attempts}/${maxRetries}. Waiting ${Math.round(delayMs)}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delayMs));
                    continue;
                }
                const error = new Error(`Request timed out after ${timeoutMs / 1000}s.`) as APIError;
                error.errorType = "TIMEOUT";
                error.status = 408;
                throw error;
            }

            // Network error or other fetch failures
            if (attempts <= maxRetries) {
                let delayMs = Math.min(maxDelayMs, baseDelayMs * Math.pow(2, attempts - 1));
                const jitter = 0.5 + Math.random();
                delayMs = delayMs * jitter;

                if (onRetry) onRetry(attempts, maxRetries, delayMs);
                console.warn(`[RETRY] Network error. Attempt ${attempts}/${maxRetries}. Waiting ${Math.round(delayMs)}ms...`);
                await new Promise(resolve => setTimeout(resolve, delayMs));
                continue;
            }

            const error = new Error(err.message || "Network error") as APIError;
            error.errorType = "NETWORK_ERROR";
            error.status = 0;
            throw error;
        }
    }

    throw new Error("Maximum retries reached");
}
