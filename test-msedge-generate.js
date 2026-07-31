const { MsEdgeTTS } = require("msedge-tts");

async function test() {
  try {
    const tts = new MsEdgeTTS();

    console.log("Connecting...");

    await tts.setMetadata(
      "en-US-AriaNeural",
      "audio-24khz-48kbitrate-mono-mp3"
    );

    console.log("Generating...");

    await tts.toFile(
      "./tts-output",
      "Hello Paul. Lumora AI is generating voices."
    );

    console.log("SUCCESS!");
  } catch (err) {
    console.error(err);
  }
}

test();