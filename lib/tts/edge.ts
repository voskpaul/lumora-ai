
import { EdgeTTS } from "@andresaya/edge-tts";
import fs from "fs";
import path from "path";

export async function generateEdgeVoice(
  text: string,
  outputDir: string,
  voiceType: string = "en-US-AriaNeural"
) {
  fs.mkdirSync(outputDir, { recursive: true });

  const tts = new EdgeTTS();

  console.log("🎤 Edge Voice:", voiceType);

  await tts.synthesize(text, voiceType, {
    outputFormat: "audio-24khz-48kbitrate-mono-mp3",
  });

  const outputPath = path.join(outputDir, "audio");

  await tts.toFile(outputPath);

  return `${outputPath}.mp3`;
}
