import ffmpeg from "fluent-ffmpeg";
import path from "path";
import fs from "fs";

const ffmpegPath = path.join(
  process.cwd(),
  "node_modules",
  "ffmpeg-static",
  "ffmpeg.exe"
);

const ffprobePath = path.join(
  process.cwd(),
  "node_modules",
  "ffprobe-static",
  "bin",
  "win32",
  "x64",
  "ffprobe.exe"
);

console.log("FFMPEG PATH:", ffmpegPath);
console.log("FFPROBE PATH:", ffprobePath);

console.log(
  "FFMPEG EXISTS:",
  fs.existsSync(ffmpegPath)
);

console.log(
  "FFPROBE EXISTS:",
  fs.existsSync(ffprobePath)
);

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

export default ffmpeg;