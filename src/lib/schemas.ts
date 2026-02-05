import { z } from "zod";

export const ClarityModeSchema = z.enum(["decision", "plan", "overwhelm", "message_prep"]);
export type ClarityMode = z.infer<typeof ClarityModeSchema>;

export const ClarifyInputSchema = z.object({
    mode: ClarityModeSchema,
    text: z.string().min(1, "Input text is required"),
    followup_answer: z.string().optional(),
});

// --- Mode Specific Output Schemas ---

// Base fields shared by all modes
const BaseFields = {
    problem_type: ClarityModeSchema,
    core_issue: z.string(),
    one_sharp_question: z.string(),
};

// Decision mode schema
export const DecisionOutputSchema = z.object({
    ...BaseFields,
    options: z.array(z.object({
        option: z.string(),
        why: z.string(),
        when_it_wins: z.string().optional()
    })).min(2).max(3),
    decision_levers: z.array(z.string()).min(1).max(3),
    tradeoffs: z.array(z.string()).min(1).max(3),
    next_steps_14_days: z.array(z.string()).min(1).max(1), // Single experiment
});

// Plan mode schema
export const PlanOutputSchema = z.object({
    ...BaseFields,
    hidden_assumptions: z.array(z.string()).min(3).max(5), // Milestones
    next_steps_14_days: z.array(z.string()).min(5).max(10),
    tradeoffs: z.array(z.string()).min(2).max(4), // Risks
    decision_levers: z.array(z.string()).min(1).max(2), // Success metrics
});

// Overwhelm mode schema
export const OverwhelmOutputSchema = z.object({
    ...BaseFields,
    top_3_priorities_today: z.array(z.string()).length(3),
    top_3_defer_or_ignore: z.array(z.string()).length(3),
    next_10_minutes: z.string(),
    next_24_hours: z.string(),
    constraint_or_boundary: z.string(),
});

// Prep mode schema - STRICT
export const PrepOutputSchema = z.object({
    ...BaseFields,
    purpose_outcome: z.string(),
    key_points: z.array(z.string()).min(3).max(6),
    structure_outline: z.object({
        opening: z.string(),
        body: z.array(z.string()).min(2).max(4), // Changed to array
        close: z.string()
    }),
    likely_questions_or_objections: z.array(z.string()).min(3).max(6),
    rehearsal_checklist: z.array(z.string()).min(3).max(6),
});

// Unified schema for API (loose to allow all modes)
export const ClarifyOutputSchema = z.object({
    problem_type: ClarityModeSchema,
    core_issue: z.string(),
    one_sharp_question: z.string(),
    // Common optional fields
    hidden_assumptions: z.array(z.string()).optional(),
    tradeoffs: z.array(z.string()).optional(),
    decision_levers: z.array(z.string()).optional(),
    options: z.array(z.object({
        option: z.string(),
        why: z.string(),
        when_it_wins: z.string().optional()
    })).optional(),
    next_steps_14_days: z.array(z.string()).optional(),
    // Prep specific
    purpose_outcome: z.string().optional(),
    key_points: z.array(z.string()).optional(),
    structure_outline: z.object({
        opening: z.string(),
        body: z.union([z.string(), z.array(z.string())]), // Accept both for flexibility
        close: z.string()
    }).optional(),
    likely_questions_or_objections: z.array(z.string()).optional(),
    rehearsal_checklist: z.array(z.string()).optional(),
    // Overwhelm specific
    top_3_priorities_today: z.array(z.string()).optional(),
    top_3_defer_or_ignore: z.array(z.string()).optional(),
    next_10_minutes: z.string().optional(),
    next_24_hours: z.string().optional(),
    constraint_or_boundary: z.string().optional(),
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
    refiningAnswer: z.string().optional(),
});

export const CommunicateOutputSchema = z.object({
    drafts: z.array(z.object({
        context: z.enum(["evaluative", "technical", "persuasive", "personal", "combined"]),
        intent: z.enum(["inform", "persuade", "explain", "apologise"]),
        draft: z.string(),
        key_changes: z.array(z.string()).min(2).max(5),
        tone: z.string(),
    })),
    refining_question: z.string(),
});

export type ClarifyInput = z.infer<typeof ClarifyInputSchema>;
export type ClarifyOutput = z.infer<typeof ClarifyOutputSchema>;
export type CommunicateInput = z.infer<typeof CommunicateInputSchema>;
export type CommunicateOutput = z.infer<typeof CommunicateOutputSchema>;
