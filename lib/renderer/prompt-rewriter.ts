import { buildCinematicPrompt } from "./prompt-builder";

const USE_GEMINI = false;

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

export type PromptSceneType =
  | "hook"
  | "introduction"
  | "explanation"
  | "call_to_action"
  | "general"
  | "portrait"
  | "urban"
  | "nature"
  | "product"
  | "technology"
  | "action";

export async function rewritePrompt(
  text: string,
  type: PromptSceneType
) {
  const fallback = buildCinematicPrompt(
    text,
    type
  );

  if (!USE_GEMINI) {
    console.log("🎬 Local Hollywood Director enabled.");
    return fallback;
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.log("⚠ Gemini API key missing.");
    return fallback;
  }

  try {
    const prompt = `
You are Lumora AI's Hollywood Prompt Director.

Convert the narration below into ONE cinematic AI image prompt.

Scene Type:
${type}

Narration:
${text}

Rules:

• One single moment only.
• No text.
• No subtitles.
• No watermark.
• Ultra photorealistic.
• Cinematic composition.
• Hollywood movie frame.
• Realistic lighting.
• Highly detailed.
• Vertical 9:16 composition.
• 8K quality.
• HDR.
• Sharp focus.
• Correct perspective.
• Correct anatomy.
• Rich environmental storytelling.
• Match the narration exactly.
• Never invent unrelated objects.
• Describe clothing, lighting, environment, camera angle and atmosphere.
• Output ONLY the prompt.
`;

    const response = await fetch(
      `${GEMINI_URL}?key=${apiKey}`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();

      console.log("========== GEMINI ERROR ==========");
      console.log(error);
      console.log("==================================");

      return fallback;
    }

    const json = await response.json();

    const rewritten =
      json?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rewritten) {
      return fallback;
    }

    console.log("🎬 Gemini Prompt Generated");

    return rewritten.trim();
  } catch (err: any) {
    console.log("========== GEMINI ERROR ==========");
    console.log(err);
    console.log("==================================");

    return fallback;
  }
}