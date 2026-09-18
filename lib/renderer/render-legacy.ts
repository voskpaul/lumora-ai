import fs from "fs";

import { createBuilder } from "./ffmpeg-builder";
import { getAssets } from "./assets";
import { getAudioDuration } from "./timing";
import { prepareASS } from "./subtitles";

type RenderInput = {
  videoId: string;
  imagesDir: string;
  voicePath: string;
  captionsPath: string;
  outputPath: string;
};

export async function renderVideo({
  imagesDir,
  voicePath,
  captionsPath,
  outputPath,
}: RenderInput): Promise<void> {
  if (!fs.existsSync(voicePath)) {
    throw new Error("Voice file missing.");
  }

  if (!fs.existsSync(captionsPath)) {
    throw new Error("Captions file missing.");
  }

  //---------------------------------------
  // Load assets
  //---------------------------------------

  const assets = getAssets(imagesDir);

  const totalDuration = await getAudioDuration(
    voicePath
  );

  const sceneDurations = distributeSceneDurations(
    totalDuration,
    assets.imageCount
  );

  const captions = prepareASS(
    captionsPath,
    captionsPath
  );

  //---------------------------------------
  // Debug
  //---------------------------------------

  console.log("========== RENDER ==========");
  console.log("Images:", assets.imageCount);
  console.log("Voice:", voicePath);
  console.log("Captions:", captions.path);
  console.log("Duration:", totalDuration);
  console.log("Scene durations:", sceneDurations);
  console.log("============================");

  //---------------------------------------
  // Current legacy renderer
  //---------------------------------------

  await new Promise<void>((resolve, reject) => {
    const command = createBuilder("ffmpeg" as any);

    command
      .input(imagesDir + "/list.txt")
      .inputOptions(["-f concat", "-safe 0"])
      .input(voicePath)
      .videoFilters([
        {
          filter: "subtitles",
          options: captions.path
            .replace(/\\/g, "/")
            .replace(/:/g, "\\:")
            .replace(/'/g, "\\'"),
        },
      ])
      .videoCodec("libx264")
      .audioCodec("aac")
      .outputOptions([
        "-pix_fmt",
        "yuv420p",
        "-shortest",
      ])
      .on("start", (cmd) => {
        console.log(cmd);
      })
      .on("end", () => {
        console.log("✅ Render complete");
        resolve();
      })
      .on("error", (err, stdout, stderr) => {
        console.error(err);
        console.log(stdout);
        console.log(stderr);
        reject(err);
      })
      .save(outputPath);
  });

  //---------------------------------------
  // Legacy renderer complete
  //---------------------------------------

  console.log(
    "Legacy renderer completed successfully."
  );
}

function distributeSceneDurations(
  totalDuration: number,
  imageCount: number
): number[] {
  // Return an array of durations (in seconds)
  // for each image/scene.

  if (imageCount <= 0) {
    return [];
  }

  if (totalDuration <= 0) {
    return new Array(imageCount).fill(0);
  }

  const base = totalDuration / imageCount;

  // Round to milliseconds to avoid long floats.
  const round = (n: number) =>
    Math.round(n * 1000) / 1000;

  const durations: number[] =
    new Array(imageCount).fill(
      round(base)
    );

  // Correct rounding error by adjusting
  // the last element.
  const currentSum = durations.reduce(
    (a, b) => a + b,
    0
  );

  const diff = round(
    totalDuration - currentSum
  );

  durations[durations.length - 1] = round(
    durations[durations.length - 1] + diff
  );

  return durations;
}