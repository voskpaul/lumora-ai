const { MsEdgeTTS } = require("msedge-tts");

(async () => {
  const tts = new MsEdgeTTS();

  console.log("Methods:");
  console.log(
    Object.getOwnPropertyNames(
      Object.getPrototypeOf(tts)
    )
  );
})();