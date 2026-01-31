import { NextRequest, NextResponse } from "next/server";
import { CommunicateInputSchema, CommunicateOutputSchema, CommunicateOutput } from "@/lib/schemas";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const validatedInput = CommunicateInputSchema.parse(body);

        // Mock logic based on input
        const drafts: CommunicateOutput["drafts"] = validatedInput.audiences.map((audience) => {
            let draftText = "";
            let tone = "";
            let keyChanges = [];

            switch (audience) {
                case "recruiter":
                    draftText = `I am excited to discuss our recent progress regarding ${validatedInput.clarity.summary.toLowerCase()}. Our focus on ${validatedInput.clarity.priorities[0].toLowerCase()} has yielded significant insights.`;
                    tone = "Professional & Eager";
                    keyChanges = ["Added call to action", "Highlighted key results"];
                    break;
                case "engineer":
                    draftText = `Regarding ${validatedInput.clarity.summary.toLowerCase()}, the primary technical focus is ${validatedInput.clarity.priorities[0].toLowerCase()}. We need to address the high-risk item: ${validatedInput.clarity.risks.find(r => r.likelihood === 'high')?.risk || 'None'}.`;
                    tone = "Technical & Direct";
                    keyChanges = ["Included technical terms", "Focused on risks"];
                    break;
                case "customer":
                    draftText = `We're making great strides in ${validatedInput.clarity.summary.toLowerCase()}. Our goal is to make things simpler and more efficient for you, specifically by ${validatedInput.clarity.priorities[0].toLowerCase().replace('synthesize', 'simplifying')}.`;
                    tone = "Benefit-oriented & Clear";
                    keyChanges = ["Removed jargon", "Simplified value proposition"];
                    break;
                case "friend":
                    draftText = `Hey, just a quick update on my project about ${validatedInput.clarity.summary.toLowerCase()}. It's going well, but I'm thinking about ${validatedInput.clarity.key_question.toLowerCase()}`;
                    tone = "Casual & Friendly";
                    keyChanges = ["Used informal language", "Added a personal touch"];
                    break;
            }

            if (validatedInput.options.concise) {
                draftText = draftText.substring(0, 100) + "...";
            }
            if (validatedInput.options.formal) {
                draftText = "Formal notice: " + draftText;
            }

            return {
                audience,
                intent: validatedInput.intent,
                draft: draftText,
                key_changes: keyChanges,
                tone,
            };
        });

        const mockOutput: CommunicateOutput = { drafts };

        // Validate output with Zod before returning
        const validatedOutput = CommunicateOutputSchema.parse(mockOutput);

        return NextResponse.json(validatedOutput);
    } catch (error: any) {
        return NextResponse.json(
            { error: error?.message || "Invalid request" },
            { status: 400 }
        );
    }
}
