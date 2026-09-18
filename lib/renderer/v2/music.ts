import ffmpeg from "@/lib/ffmpeg";

type MusicInput = {
  video: string;
  narration: string;
  music: string;
  output: string;
};

function probeDuration(file: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(file, (err, data) => {
      if (err) {
        return reject(err);
      }

      const duration = Number(data.format.duration);

      if (!Number.isFinite(duration) || duration <= 0) {
        return reject(
          new Error(
            `Unable to determine duration for: ${file}`
          )
        );
      }

      resolve(duration);
    });
  });
}

export async function attachBackgroundMusic({
  video,
  narration,
  music,
  output,
}: MusicInput): Promise<void> {
  // =====================================================
  // VIDEO TIMELINE IS THE SOURCE OF TRUTH
  // =====================================================

  const videoDuration =
    await probeDuration(video);

  const narrationDuration =
    await probeDuration(narration);

  const targetDuration =
    videoDuration;

  // =====================================================
  // MUSIC FADE SETTINGS
  // =====================================================

  const fadeInDuration =
    Math.min(2, targetDuration * 0.15);

  const fadeOutDuration =
    Math.min(
      3,
      Math.max(
        1,
        targetDuration * 0.15
      )
    );

  const fadeOutStart =
    Math.max(
      0,
      targetDuration - fadeOutDuration
    );

  console.log(
    "========== BACKGROUND MUSIC =========="
  );

  console.log(
    "Timeline video duration:",
    videoDuration
  );

  console.log(
    "Narration duration:",
    narrationDuration
  );

  console.log(
    "FINAL OUTPUT TARGET:",
    targetDuration
  );

  console.log(
    "Music volume:",
    0.18
  );

  console.log(
    "Music fade-in:",
    fadeInDuration
  );

  console.log(
    "Music fade-out start:",
    fadeOutStart
  );

  console.log(
    "Music fade-out duration:",
    fadeOutDuration
  );

  console.log(
    "======================================"
  );

  return new Promise<void>(
    (resolve, reject) => {
      ffmpeg()
        // ===============================
        // INPUT 0 — VIDEO
        // ===============================

        .input(video)

        // ===============================
        // INPUT 1 — NARRATION
        // ===============================

        .input(narration)

        // ===============================
        // INPUT 2 — BACKGROUND MUSIC
        // ===============================

        .input(music)

        .complexFilter([
          // =============================================
          // NARRATION
          //
          // Force narration to exactly match
          // the Timeline Editor/video duration.
          //
          // If narration is shorter:
          // silence is added.
          //
          // If narration is longer:
          // narration is trimmed.
          // =============================================

          `[1:a]` +
            `apad,` +
            `atrim=duration=${targetDuration},` +
            `asetpts=PTS-STARTPTS` +
            `[voice]`,

          // =============================================
          // BACKGROUND MUSIC
          //
          // Loop music and trim it exactly
          // to the Timeline Editor duration.
          // =============================================

          `[2:a]` +
            `aloop=loop=-1:size=2147483647,` +
            `volume=0.18,` +
            `atrim=duration=${targetDuration},` +
            `afade=t=in:st=0:d=${fadeInDuration},` +
            `afade=t=out:st=${fadeOutStart}:d=${fadeOutDuration},` +
            `asetpts=PTS-STARTPTS` +
            `[music]`,

          // =============================================
          // AUDIO MIX
          //
          // "first" means the narration/timeline
          // controls the resulting audio duration.
          // =============================================

          `[voice][music]` +
            `amix=` +
            `inputs=2:` +
            `duration=first:` +
            `dropout_transition=2,` +
            `atrim=duration=${targetDuration},` +
            `asetpts=PTS-STARTPTS` +
            `[aout]`,
        ])

        .outputOptions([
          // =============================================
          // VIDEO
          // =============================================

          "-map",
          "0:v:0",

          // =============================================
          // FINAL MIXED AUDIO
          // =============================================

          "-map",
          "[aout]",

          // Do not re-encode the video here.
          "-c:v",
          "copy",

          // Encode mixed audio.
          "-c:a",
          "aac",

          // =============================================
          // FINAL SAFETY LIMIT
          //
          // Timeline duration controls output.
          // =============================================

          "-t",
          `${targetDuration}`,

          "-movflags",
          "+faststart",
        ])

        .on(
          "start",
          (cmd) => {
            console.log(
              "========== MUSIC FFMPEG =========="
            );

            console.log(cmd);

            console.log(
              "=================================="
            );
          }
        )

        .on(
          "progress",
          (progress) => {
            console.log(
              "Music:",
              progress.percent ?? 0
            );
          }
        )

        .on(
          "end",
          async () => {
            try {
              const finalDuration =
                await probeDuration(output);

              console.log(
                "========== MUSIC OUTPUT =========="
              );

              console.log(
                "Expected timeline duration:",
                targetDuration
              );

              console.log(
                "Actual output duration:",
                finalDuration
              );

              console.log(
                "=================================="
              );

              console.log(
                "Background music finished."
              );

              resolve();
            } catch (error) {
              reject(error);
            }
          }
        )

        .on(
          "error",
          (err, stdout, stderr) => {
            console.error(
              "========== MUSIC ERROR =========="
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