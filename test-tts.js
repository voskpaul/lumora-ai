const { MsEdgeTTS } = require("msedge-tts");

async function testVoice() {
  try {
    console.log("🎤 Initializing Edge TTS...");

    const tts = new MsEdgeTTS();

    await tts.setMetadata(
      "en-US-AriaNeural",
      "en-US"
    );

    console.log("✅ Voice metadata loaded");

    await tts.toFile(
      "./test.mp3",
      "Hello from Lumora AI. This is a test of Edge Text To Speech."
    );

    console.log("✅ Audio generated successfully");
    console.log("📁 File saved as test.mp3");
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

testVoice();