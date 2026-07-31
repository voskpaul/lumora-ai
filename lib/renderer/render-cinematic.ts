import fs from "fs";

import { buildDirectorPlan } from "./v2/director";
import { buildPipeline } from "./pipeline";
import { createBuilder } from "./ffmpeg-builder";

type RenderInput = {
  videoId: string;
  imagesDir: string;
  voicePath: string;
  captionsPath: string;
  outputPath: string;
};

export async function renderCinematic({
  imagesDir,
  voicePath,
  captionsPath,
  outputPath,
}: RenderInput): Promise<void> {

  if (!fs.existsSync(voicePath))
    throw new Error("Voice missing.");

  if (!fs.existsSync(captionsPath))
    throw new Error("Captions missing.");

  const {
    assets,
    captions,
    subtitleScenes,
    videoScenes,
    scenePrompts,
    rawDurations,
    sceneDurations,
    audioDuration,
  } = await buildDirectorPlan({
    imagesDir,
    voicePath,
    captionsPath,
  });

  console.log("Scene durations:", sceneDurations);

  console.log(
    "Total scene duration:",
    sceneDurations.reduce((a, b) => a + b, 0)
  );

  console.log("========== DIRECTOR TIMING ==========");
  console.table(
    scenePrompts.map((scene, index) => ({
      scene: scene.scene,
      type: scene.type,
      original: rawDurations[index],
      weight: scene.durationWeight,
      final: sceneDurations[index],
    }))
  );
  console.log("=====================================");

  const escapedCaptions = captions.path
    .replace(/\\/g, "/")
    .replace(/:/g, "\\:")
    .replace(/'/g, "\\'");

  console.log("========== LENGTH CHECK ==========");
  console.log("Images:", assets.images.length);
  console.log("Subtitle scenes:", subtitleScenes.length);
  console.log("Video scenes:", videoScenes.length);
  console.log("Prompts:", scenePrompts.length);
  console.log("Durations:", sceneDurations.length);
  console.log("==================================");

  const pipeline = buildPipeline(
    sceneDurations,
    scenePrompts
  );

  console.log("========== FILTER COMPLEX ==========");
  console.log(pipeline.filterComplex);
  console.log("Final Label:", pipeline.finalVideoLabel);
  console.log("====================================");

  console.log("========== CINEMATIC ==========");
  console.log(assets.imageCount);
  console.log(audioDuration);
  console.log("===============================");

  await new Promise<void>((resolve, reject) => {

    const command = createBuilder({
      images: assets.images,
      voicePath,
      sceneDurations,
    });

    console.log("========== INPUTS ==========");
    console.log("Images:", assets.images);
    console.log("Voice:", voicePath);
    console.log("============================");

    const finalVideo = pipeline.finalVideoLabel
      .replace("[", "")
      .replace("]", "");

    command.complexFilter([
      pipeline.filterComplex,

      `[${finalVideo}]subtitles='${escapedCaptions}'[video]`,

      `[${assets.imageCount}:a]` +
      `volume=1.0,` +
      `afade=t=in:st=0:d=0.5,` +
      `afade=t=out:st=${Math.max(audioDuration - 1, 0)}:d=1` +
      `[voice]`,
    ]);

    command
      .outputOptions([
        "-map", "[video]",
        "-map", "[voice]",
        "-pix_fmt", "yuv420p",
        "-shortest",
        "-movflags", "+faststart",
      ])
      .videoCodec("libx264")
      .audioCodec("aac")
      .on("start", (cmd) => {
        console.log("========== FFMPEG ==========");
        console.log(cmd);
        console.log("============================");
      })
      .on("end", () => resolve())
      .on("error", (err, stdout, stderr) => {
        console.log("========== STDERR ==========");
        console.log(stderr);
        console.log("============================");
        reject(err);
      })
      .save(outputPath);
  });

  console.log("Pipeline attached.");
}