import { NextRequest, NextResponse } from "next/server";
import { CommunicateInputSchema, CommunicateOutputSchema } from "@/lib/schemas";
import { communicatePrompt, COMMUNICATE_SYSTEM_PROMPT } from "@/lib/prompts";
import { generateText } from "@/lib/geminiClient";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const validatedInput = CommunicateInputSchema.parse(body);

        const prompt = communicatePrompt(
            validatedInput.clarity,
            validatedInput.audiences,
            validatedInput.intent,
            validatedInput.options
        );

        let result;
        try {
            result = await generateText(prompt, COMMUNICATE_SYSTEM_PROMPT);
            CommunicateOutputSchema.parse(result);
        } catch (err: any) {
            console.warn("First Gemini attempt for /api/communicate failed, retrying...", err.message);

            const correctionPrompt = `${prompt}\n\nIMPORTANT: Your previous output was invalid. Ensure the output strictly follows the JSON schema (an object with a "drafts" array). Error: ${err.message}. RETURN ONLY VALID JSON.`;
            result = await generateText(correctionPrompt, COMMUNICATE_SYSTEM_PROMPT);
            CommunicateOutputSchema.parse(result);
        }

        return NextResponse.json(result);
    } catch (error: any) {
        console.error("API Error in /api/communicate:", error);
        return NextResponse.json(
            { error: error?.message || "Failed to process communication request." },
            { status: 500 }
        );
    }
}
