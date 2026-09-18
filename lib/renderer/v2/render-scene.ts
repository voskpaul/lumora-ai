import ffmpeg from "@/lib/ffmpeg";
import fs from "fs";
import path from "path";

import { getCameraMotion } from "../camera-motion";
import type { ColorGrade } from "./color-grade";

type RenderSceneInput = {
  image: string;
  duration: number;
  motion: string;
  colorGrade: ColorGrade;
  output: string;
};

const FPS = 30;

export async function renderScene({
  image,
  duration,
  motion,
  colorGrade,
  output,
}: RenderSceneInput): Promise<void> {
  if (!Number.isFinite(duration) || duration <= 0) {
    throw new Error(
      `Invalid scene duration: ${duration}`
    );
  }

  await fs.promises.mkdir(
    path.dirname(output),
    {
      recursive: true,
    }
  );

  // =====================================================
  // FRAME-ACCURATE TIMELINE
  // =====================================================

  const frames = Math.max(
    1,
    Math.round(duration * FPS)
  );

  /*
   * Video cannot reliably represent arbitrary
   * fractional durations.
   *
   * The actual duration is determined by:
   *
   * frames / FPS
   */

  const exactDuration =
    frames / FPS;

  // =====================================================
  // CAMERA MOTION
  //
  // IMPORTANT:
  // Use the exact render duration so camera
  // animation matches the actual scene output.
  // =====================================================

  const camera =
    getCameraMotion(
      motion,
      exactDuration
    );

  console.log(
    "========== SCENE CONFIG =========="
  );

  console.log({
    requestedDuration: duration,
    fps: FPS,
    targetFrames: frames,
    actualRenderDuration: exactDuration,
    motion,
    colorGrade,
  });

  console.log(
    "Duration difference:",
    (exactDuration - duration).toFixed(6)
  );

  console.log(
    "=================================="
  );

  await new Promise<void>(
    (resolve, reject) => {
      const command = ffmpeg();

      command
        .input(image)

        .inputOptions([
          "-loop 1",
          `-framerate ${FPS}`,
        ])

        .videoFilters([
          // =============================================
          // VERTICAL VIDEO FORMAT
          // =============================================

          "scale=1080:1920:force_original_aspect_ratio=increase",

          "crop=1080:1920",

          // =============================================
          // CAMERA MOTION
          // =============================================

          camera.zoompan,

          // =============================================
          // FRAME-ACCURATE TIMING
          // =============================================

          `trim=end_frame=${frames}`,

          "setpts=PTS-STARTPTS",

          "format=yuv420p",
        ])

        // ===============================================
        // OUTPUT FRAME RATE
        // ===============================================

        .fps(FPS)

        // ===============================================
        // EXACT NUMBER OF FRAMES
        // ===============================================

        .frames(frames)

        .videoCodec("libx264")

        .outputOptions([
          // =============================================
          // TIMING SAFETY
          // =============================================

          "-vsync",
          "cfr",

          // =============================================
          // VIDEO FORMAT
          // =============================================

          "-pix_fmt",
          "yuv420p",

          // =============================================
          // ENCODING
          // =============================================

          "-preset",
          "veryfast",

          "-crf",
          "20",

          // =============================================
          // WEB PLAYBACK
          // =============================================

          "-movflags",
          "+faststart",
        ])

        .noAudio()

        .on(
          "start",
          (cmd) => {
            console.log(
              "========== SCENE START =========="
            );

            console.log(
              "Motion:",
              motion
            );

            console.log(
              "Color Grade:",
              colorGrade
            );

            console.log(
              "Requested duration:",
              duration.toFixed(6)
            );

            console.log(
              "Target frames:",
              frames
            );

            console.log(
              "Actual render duration:",
              exactDuration.toFixed(6)
            );

            console.log(
              "FPS:",
              FPS
            );

            console.log(cmd);

            console.log(
              "================================="
            );
          }
        )

        .on(
          "progress",
          (progress) => {
            if (progress.timemark) {
              console.log(
                "Scene:",
                progress.timemark
              );
            }
          }
        )

        .on(
          "end",
          () => {
            console.log(
              "========== SCENE FINISHED =========="
            );

            console.log(
              `Requested: ${duration.toFixed(3)}s`
            );

            console.log(
              `Rendered: ${exactDuration.toFixed(3)}s`
            );

            console.log(
              `Frames: ${frames}`
            );

            console.log(
              "===================================="
            );

            resolve();
          }
        )

        .on(
          "error",
          (err, stdout, stderr) => {
            console.error(
              "========== SCENE ERROR =========="
            );

            console.error(err);

            console.error(
              "========== STDOUT =========="
            );

            console.error(stdout);

            console.error(
              "========== STDERR =========="
            );

            console.error(stderr);

            console.error(
              "================================="
            );

            reject(err);
          }
        )

        .save(output);
    }
  );
}