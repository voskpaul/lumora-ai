import { MsEdgeTTS } from "msedge-tts";
import fs from "fs";

export async function generateEdgeVoice(
  text: string,
  outputDir: string,
  voiceType: string = "en-US-AriaNeural"
) {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, {
      recursive: true,
    });
  }

  const tts = new MsEdgeTTS();

  const format =
    "audio-24khz-48kbitrate-mono-mp3" as any;

  console.log(
    "🎤 Edge Voice:",
    voiceType
  );

  await tts.setMetadata(
    voiceType as any,
    format
  );

  await tts.toFile(
    outputDir,
    text
  );

  return `${outputDir}/audio.mp3`;
}