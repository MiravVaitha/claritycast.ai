import { ClarityMode } from "./schemas";

export const CLARIFY_SYSTEM_PROMPT = `You are an AI assistant specialized in structured thinking and clarity assessment.
Your goal is to transform unstructured thoughts, plans, or messages into a clear, structured JSON assessment.
Constraints:
- Be neutral and non-prescriptive.
- Do NOT give life advice or personal opinions.
- Do NOT tell the user what they "should" do, instead identify patterns, risks, and assumptions.
- Explicitly produce structured reasoning based ONLY on the provided text.
- Output MUST be valid JSON matching the requested schema.`;

export function clarifyPrompt(mode: ClarityMode, text: string) {
    return `Mode: ${mode.replace("_", " ")}
Input Text:
"""
${text}
"""

Provide a structured assessment of the input text above.
Output as a single JSON object with the following keys:
- "summary": A concise summary of the core message or situation.
- "priorities": A list of the top 3-5 priorities identified in the text.
- "assumptions": A list of underlying assumptions made in the text.
- "risks": A list of objects with "risk" (description) and "likelihood" ("low" | "med" | "high").
- "next_actions": A list of suggested next steps to bring more clarity.
- "key_question": One fundamental question the user should answer to gain more clarity.`;
}

export const COMMUNICATE_SYSTEM_PROMPT = `You are an AI assistant specialized in tailoring communication for specific audiences.
Your goal is to generate drafts based on structured clarity data.
Constraints:
- Use ONLY the provided clarity JSON data; do NOT hallucinate facts or context not present.
- Respect the requested intent and style options.
- Maintain a tone appropriate for the specified audience.
- Output MUST be valid JSON matching the requested schema.`;

export function communicatePrompt(clarity: any, audiences: string[], intent: string, options: any) {
    const optionsDesc = [
        options.concise ? "concise" : null,
        options.formal ? "formal" : null,
        options.preserveMeaning ? "preserving original meaning" : null
    ].filter(Boolean).join(", ");

    return `Clarity Assessment Data:
${JSON.stringify(clarity, null, 2)}

Target Audiences: ${audiences.join(", ")}
Intent: ${intent}
Desired Style: ${optionsDesc}

Generate one draft communication for EACH audience specified based on the clarity assessment.
Output as a single JSON object with a key "drafts" which is an array of objects.
Each object in the "drafts" array MUST have the following keys:
- "draft": The tailored message text.
- "key_changes": A short list explaining what was emphasized or changed for this audience.
- "tone": A brief description of the tone used.
- "audience": The name of the audience (must be one of: ${audiences.join(", ")}).
- "intent": "${intent}"`;
}
