import { GoogleGenAI } from "@google/genai";

const DEFAULT_MODEL = "gemini-3-flash-preview";
const FALLBACK_MODEL = "gemini-3-flash-preview";

export function getGenAI() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("Missing Gemini API key. Please set GEMINI_API_KEY in .env.local.");
    }
    return new GoogleGenAI({ apiKey });
}

export function getGeminiModelName() {
    const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;
    // ensure no prefix just in case
    return model.startsWith("models/") ? model.replace("models/", "") : model;
}

/**
 * Debug utility to list available models if DEBUG_GEMINI=true is set.
 */
async function debugLogModels(ai: GoogleGenAI) {
    if (process.env.DEBUG_GEMINI === "true") {
        try {
            console.log("--- DEBUG: Listing available Gemini models ---");
            const models = await ai.models.list();
            console.log(JSON.stringify(models, null, 2));
            console.log("----------------------------------------------");
        } catch (err: any) {
            console.error("DEBUG: Failed to list Gemini models:", err.message);
        }
    }
}

export async function generateText(prompt: string, systemPrompt: string) {
    const ai = getGenAI();
    await debugLogModels(ai);

    let modelName = getGeminiModelName();

    try {
        return await executeGeneration(ai, modelName, prompt, systemPrompt);
    } catch (error: any) {
        const errorMessage = error?.message || "";
        const is404 = errorMessage.includes("404") || errorMessage.toLowerCase().includes("not found");

        if (is404) {
            console.warn(`Gemini model ${modelName} not found, falling back to ${FALLBACK_MODEL}`);
            return await executeGeneration(ai, FALLBACK_MODEL, prompt, systemPrompt);
        }
        throw error;
    }
}

async function executeGeneration(ai: GoogleGenAI, model: string, prompt: string, systemPrompt: string) {
    const response: any = await ai.models.generateContent({
        model,
        contents: [{ role: "user", parts: [{ text: `${systemPrompt}\n\n${prompt}` }] }],
        config: {
            responseMimeType: "application/json",
        },
    });

    // In @google/genai, the response object typically contains candidates directly
    const candidates = response.candidates || response.data?.candidates;
    const text = candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
        console.error("Gemini response missing text:", JSON.stringify(response, null, 2));
        throw new Error("Gemini returned empty response");
    }

    try {
        return JSON.parse(text);
    } catch (e) {
        console.error("Failed to parse Gemini response as JSON:", text);
        throw new Error("Invalid JSON returned by Gemini");
    }
}
