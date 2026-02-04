import { ClarityMode } from "./schemas";

export const CLARIFY_SYSTEM_PROMPT = `You are an AI assistant specialized in strategic intervention and clarity.
Your goal is to provide "intervention clarity" - identifying the core issue, hidden assumptions, and actionable next steps.
Constraints:
- Do Not mirror the user's phrasing.
- Be neutral; no therapy tone; no motivational fluff.
- Each field must add NEW information or structure.
- The "next_steps_14_days" must be low-risk experiments or concrete actions.
- Output MUST be valid JSON matching the requested schema.`;

export function buildClarityPrompt(mode: ClarityMode, text: string, followup_answer?: string) {
    let modeInstructions = "";

    switch (mode) {
        case "decision":
            modeInstructions = `Focus on comparing options and reducing uncertainty.
- core_issue: What is the actual choice vs the distraction?
- decision_levers: What variable matters most (e.g., "Time" vs "Cost")?
- options: Distinct, viable paths.
- next_steps: Experiments to gather missing info.`;
            break;
        case "plan":
            modeInstructions = `Focus on execution and sequencing.
- core_issue: What is the bottleneck?
- hidden_assumptions: What are we assuming will go right?
- next_steps: Chronological, concrete actions.`;
            break;
        case "overwhelm":
            modeInstructions = `PRODUCE CALMING, SIMPLIFIED OUTPUT TO REDUCE COGNITIVE LOAD.
- problem_type: "overwhelm"
- core_issue: 1 clear sentence identifying the root stressor.
- hidden_assumptions: 2-4 assumptions driving the stress.
- tradeoffs: 1-2 key things to let go of.
- decision_levers: 1-2 levers that matter right now.
- options: MAX 2 simple options (e.g., "Do it now" vs "Defer").
- next_steps_14_days: PRIORITIZE IMMEDIACY.
    * Item 1 MUST be a "Next 10 minutes" trivial action.
    * Item 2 MUST be a "Next 24 hours" action.
    * 2-4 additional small steps.
- one_sharp_question: A calming, grounding question.`;
            break;
        case "message_prep":
            modeInstructions = `Focus on the 'Why' and the 'Who' before drafting.
- core_issue: What is the goal of the communication?
- options: Different angles/framings for the message.`;
            break;
    }

    let prompt = `Mode: ${mode.replace("_", " ")}\n\nInput Text:\n"""\n${text}\n"""\n`;

    if (followup_answer) {
        prompt += `\nUser's Follow-up Answer to previous question:\n"""\n${followup_answer}\n"""\n\nIncorporate this new information to refine the assessment.`;
    }

    prompt += `\nAnalyze the input and provide a structured intervention.
Specific Instructions for "${mode}" mode:
${modeInstructions}

Output as a single JSON object with:
- "problem_type": One of "decision", "plan", "overwhelm", "message_prep".
- "core_issue": 1-2 sentences identifying the real problem.
- "hidden_assumptions": 2-5 non-obvious assumptions.
- "tradeoffs": 1-3 unavoidable trade-offs.
- "decision_levers": 1-3 variables that reduce uncertainty.
- "options": 2-3 distinct paths forward (unless "overwhelm" mode constraints apply). For each, include "option", "why", "when_it_wins".
- "next_steps_14_days": 3-6 concrete actions (follow "overwhelm" constraints if applicable).
- "one_sharp_question": The single most useful follow-up question.`;

    return prompt;
}

export const COMMUNICATE_SYSTEM_PROMPT = `You are an expert communication strategist.
Your goal is to rewrite and transform messages for specific contexts and intents.
Constraints:
- Do not invent facts beyond the message.
- "evaluative": Signal competence, outcomes, clarity, professionalism.
- "technical": Be precise, structured, minimal fluff, correct terminology.
- "persuasive": Benefits-first, clear CTA, address objections lightly.
- "personal": Warm, human, empathy, casual (unless formal=true).
- Output MUST be valid JSON matching the requested schema.`;

export function buildCommunicatePrompt(message: string, contexts: string[], intent: string, options: any) {
    const optionsDesc = [
        options.concise ? "concise" : null,
        options.formal ? "formal" : null,
        options.preserveMeaning ? "preserve original meaning strictly" : null
    ].filter(Boolean).join(", ");

    return `Input Message:
"""
${message}
"""

Target Audiences/Contexts: ${contexts.join(", ")}
Intent: ${intent}
Style Modifiers: ${optionsDesc}

Generate tailored drafts for EACH requested context.
Output as a single JSON object with a "drafts" array.
Each item in drafts must have:
- "context": The specific context (e.g., "technical").
- "intent": The intent used ("${intent}").
- "draft": The transformed message.
- "key_changes": Bullet points of what changed and why.
- "tone": Brief description of the tone (e.g., "Direct and confident").`;
}
