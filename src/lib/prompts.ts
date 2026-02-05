import { ClarityMode } from "./schemas";

export const CLARIFY_SYSTEM_PROMPT = `You are an AI assistant specialized in strategic intervention and clarity.
Your goal is to provide "intervention clarity" - identifying the core issue and actionable next steps depending on the mode.
Constraints:
- Do NOT mirror the user's phrasing.
- Be neutral; no therapy tone; no motivational fluff.
- Each field must add NEW information or structure.
- Output MUST be valid JSON matching the requested schema.
- Do NOT wrap JSON in markdown code blocks.`;

export function buildClarityPrompt(mode: ClarityMode, text: string, followup_answer?: string) {
  let modeInstructions = "";
  let outputExample = "";

  switch (mode) {
    case "decision":
      modeInstructions = `Mode: DECISION (Focus on options, levers, and reducing uncertainty)
- core_issue: 1-2 sentences. What is the actual choice vs the distraction?
- options: 2-3 Distinct, viable paths. For each include { option, why, when_it_wins }.
- decision_levers: 1-3 variables/information that would decide this (e.g. "Time" vs "Cost").
- tradeoffs: 1-3 unavoidable trade-offs.
- next_steps_14_days: Array with a SINGLE small experiment to reduce uncertainty in <= 7 days.
- one_sharp_question: A question to cut through the noise.`;
      outputExample = `{
  "problem_type": "decision",
  "core_issue": "string",
  "options": [{"option": "string", "why": "string", "when_it_wins": "string"}],
  "decision_levers": ["string"],
  "tradeoffs": ["string"],
  "next_steps_14_days": ["single experiment"],
  "one_sharp_question": "string"
}`;
      break;

    case "plan":
      modeInstructions = `Mode: PLAN (Focus on execution and sequencing)
- core_issue: Precise goal statement.
- hidden_assumptions: 3-5 key milestones.
- next_steps_14_days: 5-10 concrete actions.
- tradeoffs: 2-4 risks and mitigations.
- decision_levers: 1-2 success metrics.
- one_sharp_question: A question to verify the plan's robustness.`;
      outputExample = `{
  "problem_type": "plan",
  "core_issue": "string",
  "hidden_assumptions": ["milestone1", "milestone2", "milestone3"],
  "next_steps_14_days": ["action1", "action2", "action3", "action4", "action5"],
  "tradeoffs": ["risk1", "risk2"],
  "decision_levers": ["metric1"],
  "one_sharp_question": "string"
}`;
      break;

    case "overwhelm":
      modeInstructions = `Mode: OVERWHELM (Focus on calming reduction of load)
- core_issue: 1 clear sentence identifying the root stressor.
- top_3_priorities_today: Exactly 3 critical items.
- top_3_defer_or_ignore: Exactly 3 things to drop.
- next_10_minutes: What to do RIGHT NOW (single action string).
- next_24_hours: What to do by tomorrow (single action string).
- constraint_or_boundary: E.g., "If you do only one thing...".
- one_sharp_question: A gentle question to ground the user.`;
      outputExample = `{
  "problem_type": "overwhelm",
  "core_issue": "string",
  "top_3_priorities_today": ["priority1", "priority2", "priority3"],
  "top_3_defer_or_ignore": ["defer1", "defer2", "defer3"],
  "next_10_minutes": "single action",
  "next_24_hours": "single action",
  "constraint_or_boundary": "string",
  "one_sharp_question": "string"
}`;
      break;

    case "message_prep":
      modeInstructions = `Mode: PREP (Focus on structure and audience)
- core_issue: Brief context of what this message/presentation is about.
- purpose_outcome: What is the goal of this message/presentation?
- key_points: 3-6 bullets of substance.
- structure_outline: Object with { opening: "string", body: ["point1", "point2", ...], close: "string" }. Body MUST be an array of 2-4 strings.
- likely_questions_or_objections: 3-6 items.
- rehearsal_checklist: 3-6 items to check before sending/speaking.
- one_sharp_question: A question to test the message.`;
      outputExample = `{
  "problem_type": "message_prep",
  "core_issue": "string",
  "purpose_outcome": "string",
  "key_points": ["point1", "point2", "point3"],
  "structure_outline": {
    "opening": "string",
    "body": ["bodypoint1", "bodypoint2"],
    "close": "string"
  },
  "likely_questions_or_objections": ["q1", "q2", "q3"],
  "rehearsal_checklist": ["check1", "check2", "check3"],
  "one_sharp_question": "string"
}`;
      break;
  }

  let prompt = `Mode: ${mode.replace("_", " ")}\n\nInput Text:\n"""\n${text}\n"""\n`;

  if (followup_answer) {
    prompt += `\nUser's Follow-up Answer:\n"""\n${followup_answer}\n"""\n\nIncorporate this new information to refine the assessment.`;
  }

  prompt += `\n\n${modeInstructions}\n\nOutput ONLY valid JSON in this exact format:\n${outputExample}\n\nDo NOT add any extra fields. Do NOT wrap in markdown.`;

  return prompt;
}

export const COMMUNICATE_SYSTEM_PROMPT = `You are an expert communication strategist.
Your goal is to rewrite and transform messages for specific contexts and intents.
Constraints:
- Do NOT invent facts beyond the message.
- "evaluative": Signal competence, outcomes, clarity, professionalism.
- "technical": Be precise, structured, minimal fluff, correct terminology.
- "persuasive": Benefits-first, clear CTA, address objections lightly.
- "personal": Warm, human, empathy, casual (unless formal=true).
- Output MUST be valid JSON matching the requested schema.
- Do NOT wrap JSON in markdown code blocks.`;

export function buildCommunicatePrompt(
  message: string,
  contexts: string[],
  intent: string,
  options: { preserveMeaning: boolean; concise: boolean; formal: boolean },
  refiningAnswer?: string
) {
  const contextsStr = contexts.join(", ");

  const prompt = `Original Message:
"""
${message}
"""

Selected Contexts: ${contextsStr}
Intent: ${intent}
Options: ${JSON.stringify(options)}

${refiningAnswer ? `Refining Answer (Incorporating this into follow-up drafts):\n"""\n${refiningAnswer}\n"""\n` : ""}

Generate one draft for EACH selected context (${contexts.length} total)${contexts.length > 1 ? " PLUS one additional 'combined' draft that intelligently blends all selected contexts" : ""}.

For each draft:
- Rewrite the message to fit the context and intent.
- Do NOT invent facts.
- Keep key_changes grounded (2-5 items describing what you changed).
- Provide a tone descriptor.

Also generate a refining_question: One question that, if answered, would help create even better drafts.

Output ONLY valid JSON in this exact format:
{
  "drafts": [
    {
      "context": "evaluative",
      "intent": "inform",
      "draft": "rewritten message",
      "key_changes": ["change1", "change2"],
      "tone": "professional"
    },
    {
      "context": "combined",
      "intent": "inform",
      "draft": "blended rewritten message",
      "key_changes": ["blended change1", "blended change2"],
      "tone": "balanced and strategic"
    }
  ],
  "refining_question": "What specific outcome do you want from this message?"
}

Do NOT add extra fields. Do NOT wrap in markdown.`;

  return prompt;
}
