import { NextRequest, NextResponse } from "next/server";
import { ClarifyInputSchema, ClarifyOutputSchema } from "@/lib/schemas";
import { clarifyPrompt, CLARIFY_SYSTEM_PROMPT } from "@/lib/prompts";
import { generateText } from "@/lib/geminiClient";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const validatedInput = ClarifyInputSchema.parse(body);

        const prompt = clarifyPrompt(validatedInput.mode, validatedInput.text);

        let result;
        try {
            result = await generateText(prompt, CLARIFY_SYSTEM_PROMPT);
            ClarifyOutputSchema.parse(result);
        } catch (err: any) {
            console.warn("First Gemini attempt failed or invalid, retrying...", err.message);

            // Retry once with correction prompt
            const correctionPrompt = `${prompt}\n\nIMPORTANT: Your previous output was invalid. Ensure the output strictly follows the JSON schema and provides all required fields accurately. Error: ${err.message}. RETURN ONLY VALID JSON.`;
            result = await generateText(correctionPrompt, CLARIFY_SYSTEM_PROMPT);
            ClarifyOutputSchema.parse(result);
        }

        return NextResponse.json(result);
    } catch (error: any) {
        console.error("API Error in /api/clarify:", error);
        return NextResponse.json(
            { error: error?.message || "Failed to process clarity request." },
            { status: 500 }
        );
    }
}
