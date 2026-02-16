import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

const MODEL_NAME = process.env.GEMINI_MODEL || "gemini-2.0-flash-exp";
const DEBUG_AI = process.env.DEBUG_AI === "true";

export function getGenAI() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("Missing Gemini API key. Please set GEMINI_API_KEY in .env.local.");
    }
    return new GoogleGenAI({ apiKey });
}

/**
 * Check if error is a rate limit error
 */
export function isRateLimitError(error: any): boolean {
    if (!error) return false;

    const message = error.message || '';
    const status = error.status || error.statusCode || 0;

    // Check for HTTP 429 or RESOURCE_EXHAUSTED message
    return status === 429 ||
        message.includes('RESOURCE_EXHAUSTED') ||
        message.includes('rate limit') ||
        message.includes('quota');
}

/**
 * Extract retry delay from error response
 */
export function extractRetryDelay(error: any): number | null {
    if (!error) return null;

    // Try to find retry delay in various formats
    if (error.retryDelay) return error.retryDelay;
    if (error.retryInfo?.retryDelay) return error.retryInfo.retryDelay;

    // Parse from message like "Please retry in 60s"
    const message = error.message || '';
    const match = message.match(/retry in (\d+)\s*s/i);
    if (match) {
        return parseInt(match[1], 10);
    }

    // Default to 60 seconds if no specific delay found
    return 60;
}

/**
 * Extract JSON from text that might contain markdown code blocks or extra text
 */
function extractJSON(text: string): any {
    // First try direct parse
    try {
        return JSON.parse(text);
    } catch (e) {
        // Try to extract JSON from markdown code blocks
        const codeBlockMatch = text.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
        if (codeBlockMatch) {
            try {
                return JSON.parse(codeBlockMatch[1]);
            } catch (e2) {
                // Continue to brace matching
            }
        }

        // Try to find first complete JSON object using brace matching
        let braceCount = 0;
        let startIdx = -1;
        let endIdx = -1;

        for (let i = 0; i < text.length; i++) {
            if (text[i] === '{') {
                if (braceCount === 0) startIdx = i;
                braceCount++;
            } else if (text[i] === '}') {
                braceCount--;
                if (braceCount === 0 && startIdx !== -1) {
                    endIdx = i;
                    break;
                }
            }
        }

        if (startIdx !== -1 && endIdx !== -1) {
            const jsonStr = text.substring(startIdx, endIdx + 1);
            try {
                return JSON.parse(jsonStr);
            } catch (e3) {
                throw new Error("Could not extract valid JSON from response");
            }
        }

        throw new Error("No valid JSON found in response");
    }
}

export async function generateStructuredData<T>(
    systemPrompt: string,
    userPrompt: string,
    schema: z.ZodType<T>,
    schemaName: string = "Data",
    responseSchema?: any // Native Gemini JSON schema
): Promise<T> {
    const ai = getGenAI();
    const model = MODEL_NAME;

    try {
        const result = await executeGeneration(ai, model, userPrompt, systemPrompt, responseSchema);
        return validateAndParse(result, schema, schemaName);
    } catch (error: any) {
        if (DEBUG_AI) {
            console.error(`\n[DEBUG_AI] Generation failed for ${schemaName}`);
            console.error(`Error: ${error.message}`);
        }
        throw error;
    }
}

function validateAndParse<T>(json: any, schema: z.ZodType<T>, schemaName: string): T {
    const parseResult = schema.safeParse(json);
    if (!parseResult.success) {
        const errorMsg = parseResult.error.issues.map(e => `${e.path.join(".")}: ${e.message}`).join(", ");

        if (DEBUG_AI) {
            console.log(`\n[DEBUG_AI] Schema validation failed for ${schemaName}`);
            console.log(`Raw response (first 2000 chars):`, JSON.stringify(json).substring(0, 2000));
            console.log(`Zod errors:`, parseResult.error.issues);
        }

        const error: any = new Error(`Schema validation failed: ${errorMsg}`);
        error.zodIssues = parseResult.error.issues;
        error.rawData = json;
        throw error;
    }
    return parseResult.data;
}

async function executeGeneration(ai: GoogleGenAI, model: string, prompt: string, systemPrompt: string, responseSchema?: any) {
    const finalSystemPrompt = `${systemPrompt}\n\nCRITICAL: Output ONLY valid JSON.`;

    // Server-side deterministic timeout (50s)
    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("AI generation timed out on server (50s)")), 50000);
    });

    try {
        const generatePromise = (ai as any).models.generateContent({
            model,
            contents: [{ role: "user", parts: [{ text: `${finalSystemPrompt}\n\n${prompt}` }] }],
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema
            }
        });

        const result: any = await Promise.race([generatePromise, timeoutPromise]);

        // For @google/genai client (v1 SDK)
        const candidates = result.candidates || result.data?.candidates;
        const text = candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
            throw new Error("Gemini returned empty response");
        }

        try {
            return extractJSON(text);
        } catch (e) {
            if (DEBUG_AI) {
                console.log(`\n[DEBUG_AI] JSON extraction failed`);
                console.log(`Raw text (first 2000 chars):`, text.substring(0, 2000));
            }
            throw new Error("Invalid JSON returned by Gemini");
        }
    } catch (error: any) {
        if (error.message?.includes("404") || error.message?.includes("not found")) {
            if (DEBUG_AI) {
                console.error(`\n[DEBUG_AI] Model not found: ${model}`);
            }
        }
        throw error;
    }
}
