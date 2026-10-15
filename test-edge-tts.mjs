
import { EdgeTTS } from "@andresaya/edge-tts";

const tts = new EdgeTTS();

try {
  await tts.synthesize(
    "This is a test of Lumora AI voice generation.",
    "en-US-AriaNeural"
  );

  const outputPath = await tts.toFile("./edge-tts-test");
  console.log("SUCCESS: Audio saved to", outputPath);
  console.log("Audio info:", tts.getAudioInfo());
} catch (error) {
  console.error("TTS TEST FAILED:", error);
  process.exitCode = 1;
}
