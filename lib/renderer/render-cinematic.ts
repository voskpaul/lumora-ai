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
  videoId,
  imagesDir,
  voicePath,
  captionsPath,
  outputPath,
}: RenderInput) {
  // ============================================
  // VALIDATE REQUIRED FILES
  // ============================================

  if (!fs.existsSync(voicePath)) {
    throw new Error("Voice missing.");
  }

  if (!fs.existsSync(captionsPath)) {
    throw new Error("Captions missing.");
  }

  // ============================================
  // BUILD DIRECTOR PLAN
  // ============================================

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
  videoId,
  imagesDir,
  voicePath,
  captionsPath,
});

  // ============================================
  // SCENE VALIDATION
  // ============================================

  if (assets.images.length === 0) {
    throw new Error("No images available.");
  }

  if (sceneDurations.length === 0) {
    throw new Error("No scene durations available.");
  }

  if (scenePrompts.length !== sceneDurations.length) {
    throw new Error(
      `Scene mismatch: ${scenePrompts.length} prompts but ${sceneDurations.length} durations.`
    );
  }

  if (assets.images.length !== sceneDurations.length) {
    throw new Error(
      `Image mismatch: ${assets.images.length} images but ${sceneDurations.length} durations.`
    );
  }

  // ============================================
  // DIRECTOR TIMING LOGS
  // ============================================

  console.log("========== SCENE DURATIONS ==========");

  console.log(sceneDurations);

  console.log(
    "Total scene duration:",
    sceneDurations.reduce(
      (total, duration) => total + duration,
      0
    )
  );

  console.log("=====================================");

  console.log("========== DIRECTOR TIMING ==========");

  console.table(
    scenePrompts.map((scene, index) => ({
      scene: scene.scene,
      motion: scene.motion,
      emotion: scene.emotion,
      colorGrade: scene.colorGrade,
      original: rawDurations[index],
      weight: scene.durationWeight,
      final: sceneDurations[index],
    }))
  );

  console.log("=====================================");

  // ============================================
  // LENGTH CHECK
  // ============================================

  console.log("========== LENGTH CHECK ==========");

  console.log("Images:", assets.images.length);
  console.log("Subtitle scenes:", subtitleScenes.length);
  console.log("Video scenes:", videoScenes.length);
  console.log("Prompts:", scenePrompts.length);
  console.log("Durations:", sceneDurations.length);
  console.log("Audio duration:", audioDuration);

  console.log("==================================");

  // ============================================
  // ESCAPE SUBTITLE PATH
  // ============================================

  const escapedCaptions = captions.path
    .replace(/\\/g, "/")
    .replace(/:/g, "\\:")
    .replace(/'/g, "\\'");

  // ============================================
  // BUILD VIDEO PIPELINE
  // ============================================

  /*
   * IMPORTANT:
   *
   * Your current pipeline.ts accepts only:
   *
   * buildPipeline(sceneDurations, scenePrompts)
   *
   * Therefore, DO NOT pass:
   *
   * timeline.transitionDuration
   *
   * The transition duration is currently
   * controlled inside pipeline.ts.
   */

  // ============================================
// TRANSITION SETTINGS
// ============================================

const transitionDuration = 0.8;

// ============================================
// BUILD VIDEO PIPELINE
// ============================================

const pipeline = buildPipeline(
  sceneDurations,
  scenePrompts,
  transitionDuration
);

  console.log("========== FILTER COMPLEX ==========");

  console.log(pipeline.filterComplex);

  console.log(
    "Final Label:",
    pipeline.finalVideoLabel
  );

  console.log("====================================");

  // ============================================
  // CINEMATIC INFO
  // ============================================

  console.log("========== CINEMATIC ==========");

  console.log(
    "Image count:",
    assets.imageCount
  );

  console.log(
    "Audio duration:",
    audioDuration
  );

  console.log("===============================");

  // ============================================
  // CREATE FFMPEG COMMAND
  // ============================================

  await new Promise<void>((resolve, reject) => {
    const command = createBuilder({
      images: assets.images,
      voicePath,
      sceneDurations,
    });

    console.log("========== INPUTS ==========");

    console.log(
      "Images:",
      assets.images
    );

    console.log(
      "Voice:",
      voicePath
    );

    console.log("============================");

    /*
     * Remove brackets from the pipeline's
     * final video label.
     *
     * Example:
     *
     * [transition3]
     *
     * becomes:
     *
     * transition3
     */

    const finalVideo = pipeline.finalVideoLabel
      .replace("[", "")
      .replace("]", "");

    // ============================================
    // BUILD FILTER COMPLEX
    // ============================================

    command.complexFilter([
      /*
       * VIDEO PIPELINE
       */

      pipeline.filterComplex,

      /*
       * SUBTITLES
       */

      `[${finalVideo}]` +
        `subtitles='${escapedCaptions}'` +
        `[video]`,

      /*
       * VOICE AUDIO
       *
       * The voice is faded in and out,
       * but its original duration is preserved.
       */

      `[${assets.imageCount}:a]` +
        `volume=1.0,` +
        `afade=t=in:st=0:d=0.5,` +
        `afade=t=out:` +
        `st=${Math.max(
          audioDuration - 1,
          0
        )}:d=1` +
        `[voice]`,
    ]);

    // ============================================
    // OUTPUT SETTINGS
    // ============================================

    command
      .outputOptions([
        "-map",
        "[video]",

        "-map",
        "[voice]",

        "-pix_fmt",
        "yuv420p",

        "-movflags",
        "+faststart",

        /*
         * We intentionally do not use
         * -shortest here.
         *
         * The cinematic pipeline controls
         * the video timeline.
         */
      ])

      .videoCodec("libx264")

      .audioCodec("aac")

      .on("start", (cmd) => {
        console.log(
          "========== FFMPEG =========="
        );

        console.log(cmd);

        console.log(
          "============================"
        );
      })

      .on("progress", (progress) => {
        console.log(
          "Render progress:",
          progress.percent ?? 0
        );
      })

      .on("end", () => {
        console.log(
          "========== CINEMATIC COMPLETE =========="
        );

        console.log(
          "Output:",
          outputPath
        );

        console.log(
          "========================================"
        );

        resolve();
      })

      .on(
        "error",
        (err, stdout, stderr) => {
          console.error(
            "========== FFMPEG ERROR =========="
          );

          console.error("Error:");
          console.error(err);

          console.error(
            "========== STDERR =========="
          );

          console.error(stderr);

          console.error(
            "========== STDOUT =========="
          );

          console.error(stdout);

          console.error(
            "================================"
          );

          reject(err);
        }
      )

      .save(outputPath);
  });

  console.log("Pipeline attached.");
}