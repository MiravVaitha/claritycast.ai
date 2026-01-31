import { z } from "zod";

export const ClarityModeSchema = z.enum(["decision", "plan", "brain_dump", "message_prep"]);

export const ClarifyInputSchema = z.object({
    mode: ClarityModeSchema,
    text: z.string().min(1, "Input text is required"),
});

export const ClarifyOutputSchema = z.object({
    summary: z.string(),
    priorities: z.array(z.string()),
    assumptions: z.array(z.string()),
    risks: z.array(z.object({
        risk: z.string(),
        likelihood: z.enum(["low", "med", "high"]),
    })),
    next_actions: z.array(z.string()),
    key_question: z.string(),
});

export const CommunicateInputSchema = z.object({
    clarity: ClarifyOutputSchema,
    audiences: z.array(z.enum(["recruiter", "engineer", "customer", "friend"])),
    intent: z.enum(["inform", "persuade", "explain", "apologise"]),
    options: z.object({
        preserveMeaning: z.boolean(),
        concise: z.boolean(),
        formal: z.boolean(),
    }),
});

export const CommunicateOutputSchema = z.object({
    drafts: z.array(z.object({
        audience: z.enum(["recruiter", "engineer", "customer", "friend"]),
        intent: z.enum(["inform", "persuade", "explain", "apologise"]),
        draft: z.string(),
        key_changes: z.array(z.string()),
        tone: z.string(),
    })),
});

export type ClarityMode = z.infer<typeof ClarityModeSchema>;
export type ClarifyInput = z.infer<typeof ClarifyInputSchema>;
export type ClarifyOutput = z.infer<typeof ClarifyOutputSchema>;
export type CommunicateInput = z.infer<typeof CommunicateInputSchema>;
export type CommunicateOutput = z.infer<typeof CommunicateOutputSchema>;
