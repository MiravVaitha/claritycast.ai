import { NextResponse } from "next/server";
import {
    ClarifyInputSchema,
    ClarifyOutputSchema,
    ClarifyRefineInputSchema,
} from "@/lib/schemas";
import { generateStructuredData, isRateLimitError, extractRetryDelay } from "@/lib/geminiClient";
import {
    buildClarityPrompt,
    buildClarityRefinePrompt,
    CLARIFY_SYSTEM_PROMPT,
} from "@/lib/prompts";
import { ClarityMode } from "@/lib/schemas";
import { rateLimit } from "@/lib/rate-limit";

const DEBUG_AI = process.env.DEBUG_AI === "true";

// Native Gemini schemas for each mode (includes refining_questions)
const CLARITY_GEMINI_SCHEMAS: Record<string, any> = {
    decision: {
        type: "object",
        properties: {
            problem_type: { type: "string" },
            core_issue: { type: "string" },
            options: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        option: { type: "string" },
                        why: { type: "string" },
                        when_it_wins: { type: "string" }
                    },
                    required: ["option", "why"]
                }
            },
            decision_levers: { type: "array", items: { type: "string" } },
            tradeoffs: { type: "array", items: { type: "string" } },
            next_steps_14_days: { type: "array", items: { type: "string" } },
            one_sharp_question: { type: "string" },
            refining_questions: { type: "array", items: { type: "string" } },
        },
        required: ["problem_type", "core_issue", "options", "decision_levers", "tradeoffs", "next_steps_14_days", "one_sharp_question", "refining_questions"]
    },
    plan: {
        type: "object",
        properties: {
            problem_type: { type: "string" },
            core_issue: { type: "string" },
            hidden_assumptions: { type: "array", items: { type: "string" } },
            next_steps_14_days: { type: "array", items: { type: "string" } },
            tradeoffs: { type: "array", items: { type: "string" } },
            decision_levers: { type: "array", items: { type: "string" } },
            one_sharp_question: { type: "string" },
            refining_questions: { type: "array", items: { type: "string" } },
        },
        required: ["problem_type", "core_issue", "hidden_assumptions", "next_steps_14_days", "tradeoffs", "decision_levers", "one_sharp_question", "refining_questions"]
    },
    overwhelm: {
        type: "object",
        properties: {
            problem_type: { type: "string" },
            core_issue: { type: "string" },
            top_3_priorities_today: { type: "array", items: { type: "string" } },
            top_3_defer_or_ignore: { type: "array", items: { type: "string" } },
            next_10_minutes: { type: "string" },
            next_24_hours: { type: "string" },
            constraint_or_boundary: { type: "string" },
            one_sharp_question: { type: "string" },
            refining_questions: { type: "array", items: { type: "string" } },
        },
        required: ["problem_type", "core_issue", "top_3_priorities_today", "top_3_defer_or_ignore", "next_10_minutes", "next_24_hours", "constraint_or_boundary", "one_sharp_question", "refining_questions"]
    },
    message_prep: {
        type: "object",
        properties: {
            problem_type: { type: "string" },
            core_issue: { type: "string" },
            purpose_outcome: { type: "string" },
            key_points: { type: "array", items: { type: "string" } },
            structure_outline: {
                type: "object",
                properties: {
                    opening: { type: "string" },
                    body: { type: "array", items: { type: "string" } },
                    close: { type: "string" }
                },
                required: ["opening", "body", "close"]
            },
            likely_questions_or_objections: { type: "array", items: { type: "string" } },
            rehearsal_checklist: { type: "array", items: { type: "string" } },
            one_sharp_question: { type: "string" },
            refining_questions: { type: "array", items: { type: "string" } },
        },
        required: ["problem_type", "core_issue", "purpose_outcome", "key_points", "structure_outline", "likely_questions_or_objections", "rehearsal_checklist", "one_sharp_question", "refining_questions"]
    }
};

export async function POST(req: Request) {
    // Rate limit by IP
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const { allowed, retryAfterSeconds } = rateLimit(ip);
    if (!allowed) {
        return NextResponse.json(
            { errorType: "RATE_LIMIT", message: "Too many requests. Please wait before trying again.", retryAfterSeconds },
            { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
        );
    }

    try {
        let body: any;

        // Parse body
        try {
            body = await req.json();
            if (DEBUG_AI) {
                console.log(`\n========================================`);
                console.log(`[DEBUG_AI] /api/clarify - action: ${body.action || "generate"}`);
                console.log(`Mode: ${body.mode || "undefined"}`);
                console.log(`Text (first 300 chars): ${(body.text || "").substring(0, 300)}`);
                console.log(`========================================\n`);
            }
        } catch (parseError: any) {
            console.error("[ERROR] Failed to parse request body:", parseError.message);
            return NextResponse.json(
                { errorType: "INVALID_INPUT", message: "Invalid JSON in request body" },
                { status: 400 }
            );
        }

        const action = body.action ?? "generate";

        // ── REFINE action ──────────────────────────────────────────────────────
        if (action === "refine") {
            const parseResult = ClarifyRefineInputSchema.safeParse(body);
            if (!parseResult.success) {
                return NextResponse.json(
                    { errorType: "INVALID_INPUT", message: "Invalid refine input", details: parseResult.error.issues },
                    { status: 400 }
                );
            }

            const { mode, text, refining_answers, extra_context, prior_output } = parseResult.data;
            const priorQuestions = (prior_output?.refining_questions as [string, string, string] | undefined);

            const userPrompt = buildClarityRefinePrompt(
                mode,
                text,
                refining_answers,
                extra_context,
                priorQuestions
            );

            const output = await generateStructuredData(
                CLARIFY_SYSTEM_PROMPT,
                userPrompt,
                ClarifyOutputSchema,
                `Clarity Refinement (${mode})`,
                CLARITY_GEMINI_SCHEMAS[mode]
            );

            if (DEBUG_AI) {
                console.log(`[DEBUG_AI] /api/clarify - Refine success for mode: ${mode}\n`);
            }

            return NextResponse.json(output);
        }

        // ── GENERATE action ────────────────────────────────────────────────────
        const parseResult = ClarifyInputSchema.safeParse(body);
        if (!parseResult.success) {
            const modeError = parseResult.error.issues.find((e: any) => e.path[0] === "mode");
            if (modeError) {
                return NextResponse.json(
                    { errorType: "INVALID_INPUT", message: "Invalid mode. Expected one of: decision, plan, overwhelm, message_prep." },
                    { status: 400 }
                );
            }
            return NextResponse.json(
                { errorType: "INVALID_INPUT", message: "Invalid input variables", details: parseResult.error.issues },
                { status: 400 }
            );
        }

        const { mode, text, followup_answer } = parseResult.data;
        const userPrompt = buildClarityPrompt(mode, text, followup_answer);

        const output = await generateStructuredData(
            CLARIFY_SYSTEM_PROMPT,
            userPrompt,
            ClarifyOutputSchema,
            `Clarity Assessment (${mode})`,
            CLARITY_GEMINI_SCHEMAS[mode]
        );

        if (DEBUG_AI) {
            console.log(`[DEBUG_AI] /api/clarify - Success for mode: ${mode}\n`);
        }

        return NextResponse.json(output);

    } catch (error: any) {
        console.error("[ERROR] Clarity API Error:", error.message);

        if (isRateLimitError(error)) {
            const retryAfter = extractRetryDelay(error);
            return NextResponse.json({
                errorType: "RATE_LIMIT",
                message: "You've hit the Gemini free-tier rate limit/quota.",
                retryAfterSeconds: retryAfter
            }, { status: 429 });
        }

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
