import ffmpeg from "@/lib/ffmpeg";
import {
  getColorGradeFilter,
  type ColorGrade,
} from "./color-grade";

type EffectsAndSubtitlesInput = {
  input: string;
  output: string;
  grade: ColorGrade;
  subtitles: string;
};

function escapeFilterPath(file: string): string {
  return file
    .replace(/\\/g, "/")
    .replace(/:/g, "\\:")
    .replace(/'/g, "\\'");
}

export async function applyCinematicEffectsAndSubtitles({
  input,
  output,
  grade,
  subtitles,
}: EffectsAndSubtitlesInput): Promise<void> {
  const colorGrade = getColorGradeFilter(grade);

  const escapedSubtitles =
    escapeFilterPath(subtitles);

  /*
   * FINAL VIDEO FILTER PIPELINE
   *
   * Order:
   *
   * 1. Color grade
   * 2. Vignette
   * 3. ASS subtitle rendering
   *
   * Everything happens in ONE video filter pass
   * and ONE final video encode.
   */
  const filters: string[] = [
    colorGrade,
    "vignette=PI/5",
    `subtitles='${escapedSubtitles}'`,
  ];

  console.log(
    "========== FINAL VIDEO FILTERS =========="
  );

  console.log({
    grade,
    colorGrade,
    subtitles,
  });

  console.log(
    filters.join(",")
  );

  console.log(
    "========================================="
  );

  return new Promise<void>((resolve, reject) => {
    const command = ffmpeg()
      .input(input)
      .videoFilters(filters)
      .videoCodec("libx264")
      .audioCodec("copy")
      .outputOptions([
        "-preset",
        "ultrafast",
        "-crf",
        "21",
        "-pix_fmt",
        "yuv420p",
        "-threads",
        "0",
        "-movflags",
        "+faststart",
      ]);

    command.on(
      "start",
      (commandLine: string) => {
        console.log(
          "========== FINAL VIDEO ENCODE =========="
        );

        console.log(commandLine);

        console.log(
          "========================================"
        );
      }
    );

    command.on(
      "progress",
      (progress: any) => {
        const percent =
          Number.isFinite(progress?.percent)
            ? progress.percent
            : 0;

        console.log(
          "Final Encode:",
          percent
        );
      }
    );

    command.on(
      "end",
      () => {
        console.log(
          "Final video encode finished."
        );

        resolve();
      }
    );

    (
      command as {
        on: (
          event: string,
          listener: (...args: any[]) => void
        ) => unknown;
      }
    ).on(
      "error",
      (
        error: Error,
        stdout?: string,
        stderr?: string
      ) => {
        console.error(
          "========== FINAL ENCODE ERROR =========="
        );

        console.error(
          "ERROR:",
          error
        );

        if (stderr) {
          console.error(
            "========== FFMPEG STDERR =========="
          );

          console.error(stderr);
        }

        if (stdout) {
          console.error(
            "========== FFMPEG STDOUT =========="
          );

          console.error(stdout);
        }

        console.error(
          "===================================="
        );

        reject(error);
      }
    );

    command.save(output);
  });
}