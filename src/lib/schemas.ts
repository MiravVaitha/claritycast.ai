import { z } from "zod";

export const ClarityModeSchema = z.enum(["decision", "plan", "overwhelm", "message_prep"]);
// Note: "brain_dump" mapped to "overwhelm" or kept if needed. The prompt asked for specific types.
// The user request specified: "problem_type": "decision" | "plan" | "overwhelm" | "message_prep"
// I will align the ClarityMode to valid problem types or map them.
// Let's allow the UI mode to map to these. 

export const ClarifyInputSchema = z.object({
    mode: ClarityModeSchema,
    text: z.string().min(1, "Input text is required"),
    followup_answer: z.string().optional(),
});

export const ClarifyOutputSchema = z.object({
    problem_type: z.enum(["decision", "plan", "overwhelm", "message_prep"]),
    core_issue: z.string(),
    hidden_assumptions: z.array(z.string()),
    tradeoffs: z.array(z.string()),
    decision_levers: z.array(z.string()),
    options: z.array(z.object({
        option: z.string(),
        why: z.string(),
        when_it_wins: z.string()
    })),
    next_steps_14_days: z.array(z.string()),
    one_sharp_question: z.string(),
});

export const CommunicateInputSchema = z.object({
    message: z.string().min(1),
    contexts: z.array(z.enum(["evaluative", "technical", "persuasive", "personal"])),
    intent: z.enum(["inform", "persuade", "explain", "apologise"]),
    options: z.object({
        preserveMeaning: z.boolean(),
        concise: z.boolean(),
        formal: z.boolean(),
    }),
});

export const CommunicateOutputSchema = z.object({
    drafts: z.array(z.object({
        context: z.enum(["evaluative", "technical", "persuasive", "personal"]),
        intent: z.enum(["inform", "persuade", "explain", "apologise"]),
        draft: z.string(),
        key_changes: z.array(z.string()),
        tone: z.string(),
    })),
});

export type ClarityMode = z.infer<typeof ClarifyInputSchema>["mode"];
export type ClarifyInput = z.infer<typeof ClarifyInputSchema>;
export type ClarifyOutput = z.infer<typeof ClarifyOutputSchema>;
export type CommunicateInput = z.infer<typeof CommunicateInputSchema>;
export type CommunicateOutput = z.infer<typeof CommunicateOutputSchema>;
