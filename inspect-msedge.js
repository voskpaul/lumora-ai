const { MsEdgeTTS } = require("msedge-tts");

(async () => {
  const tts = new MsEdgeTTS();

  await tts.setMetadata(
    "en-US-AriaNeural",
    "en-US"
  );

  console.log(tts);
})();