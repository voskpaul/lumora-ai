import ffmpeg from "@/lib/ffmpeg";

type AudioInput = {
  video: string;
  narration: string;
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

export async function attachNarration({
  video,
  narration,
  output,
}: AudioInput): Promise<void> {

  const videoDuration =
    await probeDuration(video);

  const narrationDuration =
    await probeDuration(narration);

  console.log(
    "========== NARRATION TIMING =========="
  );

  console.log(
    "Timeline / video duration:",
    videoDuration
  );

  console.log(
    "Narration duration:",
    narrationDuration
  );

  console.log(
    "FINAL OUTPUT TARGET:",
    videoDuration
  );

  console.log(
    "======================================"
  );

  await new Promise<void>((resolve, reject) => {

    ffmpeg()

      .input(video)

      .input(narration)

      .complexFilter([

        /*
         * Keep narration available for the
         * entire timeline duration.
         *
         * If narration is shorter:
         * silence fills the remaining time.
         *
         * If narration is longer:
         * trim it to the timeline.
         */

        `[1:a]` +
          `apad,` +
          `atrim=duration=${videoDuration},` +
          `asetpts=PTS-STARTPTS` +
          `[voice]`,

      ])

      .outputOptions([

        "-map",
        "0:v:0",

        "-map",
        "[voice]",

        "-c:v",
        "copy",

        "-c:a",
        "aac",

        "-t",
        `${videoDuration}`,

        "-movflags",
        "+faststart",

      ])

      .on("start", (cmd) => {

        console.log(
          "========== AUDIO =========="
        );

        console.log(cmd);

        console.log(
          "==========================="
        );

      })

      .on("progress", (progress) => {

        console.log(
          "Audio Progress:",
          progress.percent ?? 0
        );

      })

      .on("end", () => {

        console.log(
          "Audio finished."
        );

        resolve();

      })

      .on(
        "error",
        (err, stdout, stderr) => {

          console.error(
            "========== AUDIO ERROR =========="
          );

          console.error(err);

          console.error(stderr);

          console.error(
            "================================="
          );

          reject(err);

        }
      )

      .save(output);

  });

}