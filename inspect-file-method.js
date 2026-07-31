const { MsEdgeTTS } = require("msedge-tts");

(async () => {
  const tts = new MsEdgeTTS();

  await tts.setMetadata(
    "en-US-AriaNeural",
    "audio-24khz-48kbitrate-mono-mp3"
  );

  console.log(tts.toFile.toString());
})();