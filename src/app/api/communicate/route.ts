import { NextResponse } from "next/server";
import { CommunicateInputSchema, CommunicateOutputSchema } from "@/lib/schemas";
import { generateStructuredData, isRateLimitError, extractRetryDelay } from "@/lib/geminiClient";
import { buildCommunicatePrompt, COMMUNICATE_SYSTEM_PROMPT } from "@/lib/prompts";

const DEBUG_AI = process.env.DEBUG_AI === "true";

export async function POST(req: Request) {
    try {
        let body: any;

        // Parse body
        try {
            body = await req.json();
            if (DEBUG_AI) {
                console.log(`\n========================================`);
                console.log(`[DEBUG_AI] /api/communicate - Request received`);
                console.log(`Contexts: ${(body.contexts || []).join(", ")}`);
                console.log(`Intent: ${body.intent || 'undefined'}`);
                console.log(`Message (first 300 chars): ${(body.message || '').substring(0, 300)}`);
                console.log(`Options:`, body.options);
                console.log(`========================================\n`);
            }
        } catch (parseError: any) {
            console.error("[ERROR] Failed to parse request body:", parseError.message);
            return NextResponse.json(
                { errorType: "INVALID_INPUT", message: "Invalid JSON in request body" },
                { status: 400 }
            );
        }

        // Validate Input
        const parseResult = CommunicateInputSchema.safeParse(body);
        if (!parseResult.success) {
            return NextResponse.json(
                { errorType: "INVALID_INPUT", message: "Invalid input variables", details: parseResult.error.issues },
                { status: 400 }
            );
        }

        const { message, contexts, intent, options, refiningAnswer } = parseResult.data;
        const userPrompt = buildCommunicatePrompt(message, contexts, intent, options, refiningAnswer);

        // Repair prompt function for Communication
        const repairPromptFn = (error: string, originalPrompt: string) => {
            return `Previous JSON generation failed validation.
Error: ${error}

Rewrite ONLY the JSON to match schema exactly. No extra keys. No markdown.
You must generate exactly ${contexts.length > 1 ? contexts.length + 1 : contexts.length} drafts (one for each context: ${contexts.join(", ")}${contexts.length > 1 ? " plus one combined draft" : ""}).
Each draft must have: context, intent, draft, key_changes (array of 2-5 strings), tone.
You must also include a refining_question (string).

${originalPrompt}`;
        };

        const output = await generateStructuredData(
            COMMUNICATE_SYSTEM_PROMPT,
            userPrompt,
            CommunicateOutputSchema,
            "Communication Drafts",
            repairPromptFn
        );

        if (DEBUG_AI) {
            console.log(`[DEBUG_AI] /api/communicate - Success, generated ${output.drafts.length} drafts\n`);
        }

        return NextResponse.json(output);

    } catch (error: any) {
        console.error("[ERROR] Communication API Error:", error.message);

        // Check for rate limit
        if (isRateLimitError(error)) {
            const retryAfter = extractRetryDelay(error);
            return NextResponse.json({
                errorType: "RATE_LIMIT",
                message: "You've hit the Gemini free-tier rate limit/quota.",
                retryAfterSeconds: retryAfter
            }, { status: 429 });
        }

        // Build error response for other errors
        const errorResponse: any = {
            errorType: error.errorType || "AI_ERROR",
            message: error.message || "AI request failed."
        };

        if (DEBUG_AI) {
            errorResponse.debug = {
                error: error.message,
                issues: error.zodIssues?.slice(0, 5),
                rawPreview: error.rawData ? JSON.stringify(error.rawData).substring(0, 300) : null
            };
        }

        return NextResponse.json(errorResponse, { status: 500 });
    }
}
