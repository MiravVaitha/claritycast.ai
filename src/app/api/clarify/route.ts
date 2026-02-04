import { NextResponse } from "next/server";
import { ClarifyInputSchema, ClarifyOutputSchema } from "@/lib/schemas";
import { generateStructuredData } from "@/lib/geminiClient";
import { buildClarityPrompt, CLARIFY_SYSTEM_PROMPT } from "@/lib/prompts";

export async function POST(req: Request) {
    try {
        const body = await req.json();

        // Validate Input
        const parseResult = ClarifyInputSchema.safeParse(body);
        if (!parseResult.success) {
            // Check if mode is invalid
            const modeError = parseResult.error.errors.find(e => e.path[0] === 'mode');
            if (modeError) {
                return NextResponse.json(
                    { error: "Invalid mode. Expected one of: decision, plan, overwhelm, message_prep." },
                    { status: 400 }
                );
            }
            return NextResponse.json(
                { error: "Invalid input", details: parseResult.error.errors },
                { status: 400 }
            );
        }

        const { mode, text, followup_answer } = parseResult.data;

        const userPrompt = buildClarityPrompt(mode, text, followup_answer);

        const output = await generateStructuredData(
            CLARIFY_SYSTEM_PROMPT,
            userPrompt,
            ClarifyOutputSchema,
            "Clarity Assessment"
        );

        // Ensure arrays are initialized even if LLM returns partials (Validation usually catches this, but for extra safety logic)
        const safeOutput = {
            ...output,
            hidden_assumptions: output.hidden_assumptions ?? [],
            tradeoffs: output.tradeoffs ?? [],
            decision_levers: output.decision_levers ?? [],
            options: output.options ?? [],
            next_steps_14_days: output.next_steps_14_days ?? [],
        };

        return NextResponse.json(safeOutput);

    } catch (error: any) {
        console.error("Clarity API Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to generate clarity assessment" },
            { status: 500 }
        );
    }
}
