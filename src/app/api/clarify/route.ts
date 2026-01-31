import { NextRequest, NextResponse } from "next/server";
import { ClarifyInputSchema, ClarifyOutputSchema, ClarifyOutput } from "@/lib/schemas";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const validatedInput = ClarifyInputSchema.parse(body);

        // Mock logic based on input mode and text
        const mockOutput: ClarifyOutput = {
            summary: `Clarity assessment for your ${validatedInput.mode.replace("_", " ")}: "${validatedInput.text.substring(0, 50)}${validatedInput.text.length > 50 ? '...' : ''}"`,
            priorities: [
                "Synthesize complex terminology",
                "Identify core decision criteria",
                "Streamline the communication flow"
            ],
            assumptions: [
                "The audience has basic technical knowledge",
                "The timeline is flexible but needs definition",
                "Budget is not the primary constraint for this phase"
            ],
            risks: [
                { risk: "Misalignment on key objectives", likelihood: "low" },
                { risk: "Data privacy requirements not fully defined", likelihood: "med" },
                { risk: "Resource availability for immediate implementation", likelihood: "high" }
            ],
            next_actions: [
                "Draft a high-level project roadmap",
                "Schedule a stakeholder alignment meeting",
                "Finalize the technical requirements document"
            ],
            key_question: "What is the single most important outcome you need from this communication?"
        };

        // Validate output with Zod before returning
        const validatedOutput = ClarifyOutputSchema.parse(mockOutput);

        return NextResponse.json(validatedOutput);
    } catch (error: any) {
        return NextResponse.json(
            { error: error?.message || "Invalid request" },
            { status: 400 }
        );
    }
}
