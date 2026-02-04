import { NextResponse } from "next/server";
import { CommunicateInputSchema, CommunicateOutputSchema } from "@/lib/schemas";
import { generateStructuredData } from "@/lib/geminiClient";
import { buildCommunicatePrompt, COMMUNICATE_SYSTEM_PROMPT } from "@/lib/prompts";

export async function POST(req: Request) {
    try {
        const body = await req.json();

        // Validate Input
        const parseResult = CommunicateInputSchema.safeParse(body);
        if (!parseResult.success) {
            return NextResponse.json(
                { error: "Invalid input", details: parseResult.error.errors },
                { status: 400 }
            );
        }

        const { message, contexts, intent, options } = parseResult.data;

        const userPrompt = buildCommunicatePrompt(message, contexts, intent, options);

        const output = await generateStructuredData(
            COMMUNICATE_SYSTEM_PROMPT,
            userPrompt,
            CommunicateOutputSchema,
            "Communication Drafts"
        );

        return NextResponse.json(output);

    } catch (error: any) {
        console.error("Communication API Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to generate drafts" },
            { status: 500 }
        );
    }
}
