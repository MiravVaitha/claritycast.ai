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
}

const DEFAULT_TIMEOUT = 25000; // 25s
const DEFAULT_RETRIES = 1;

/**
 * Robust fetch wrapper with timeout and automatic retry
 */
export async function apiClient<T>(
    endpoint: string,
    body: any,
    options: RequestOptions = {}
): Promise<T> {
    const {
        timeoutMs = DEFAULT_TIMEOUT,
        maxRetries = DEFAULT_RETRIES
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
                const isTransient = [408, 502, 503, 504].includes(response.status);

                if (isTransient && attempts <= maxRetries) {
                    console.warn(`Transient error ${response.status}. Retrying attempt ${attempts}/${maxRetries}...`);
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

            const isTimeout = err.name === 'AbortError';

            // Check if we should retry on timeout or network error
            if (attempts <= maxRetries) {
                const retryReason = isTimeout ? "Timeout" : "Network error";
                console.warn(`${retryReason}. Retrying attempt ${attempts}/${maxRetries}...`);
                continue;
            }

            // Create a structured error for client-side failures
            const error = new Error(isTimeout ? "Request timed out after 25s." : (err.message || "Network error")) as APIError;
            error.errorType = isTimeout ? "TIMEOUT" : "NETWORK_ERROR";
            error.status = isTimeout ? 408 : 0;
            throw error;
        }
    }

    throw new Error("Maximum retries reached");
}
