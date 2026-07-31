import { buildCinematicPrompt } from "./prompt-builder";
const USE_GEMINI = false;
const GEMINI_URL =
"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

export async function rewritePrompt(
  narration: string,
  sceneType:
    | "hook"
    | "introduction"
    | "explanation"
    | "call_to_action"
    | "general"
) {
  const fallback = buildCinematicPrompt(
    narration,
    sceneType
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
You are an award-winning Hollywood concept artist.

Rewrite the following narration into a single AI image prompt.

Requirements:

- photorealistic
- cinematic
- visually descriptive
- one scene only
- no text
- no captions
- no watermark
- vertical composition
- suitable for Flux image generation
- 8K
- HDR
- dramatic lighting
- realistic humans if appropriate
- output ONLY the prompt

Narration:

${narration}
`;

console.log("Gemini key exists:", !!apiKey);
console.log("Gemini key length:", apiKey.length);
console.log("Gemini URL:", GEMINI_URL);

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
  const errorText = await response.text();

  console.log("========== GEMINI ERROR ==========");
  console.log("Status:", response.status);
  console.log(errorText);
  console.log("==================================");

  return fallback;
}

    const json = await response.json();

    const rewritten =
      json?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rewritten) {
      return fallback;
    }

    console.log("✅ Gemini Prompt Rewritten");

    return rewritten.trim();
  } catch (err: any) {
  console.log("========== FETCH ERROR ==========");
  console.log(err);
  console.log(err?.message);
  console.log("=================================");

  return fallback;
}
}