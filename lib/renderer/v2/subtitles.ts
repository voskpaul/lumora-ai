import ffmpeg from "@/lib/ffmpeg";

type BurnSubtitlesInput = {
  video: string;
  subtitles: string;
  output: string;
};

export async function burnSubtitles({
  video,
  subtitles,
  output,
}: BurnSubtitlesInput): Promise<void> {
  const escaped = subtitles
    .replace(/\\/g, "/")
    .replace(/:/g, "\\:")
    .replace(/'/g, "\\'");

  await new Promise<void>((resolve, reject) => {
    ffmpeg()
      .input(video)

      .videoFilters([
        `subtitles='${escaped}'`,
      ])

      .videoCodec("libx264")
      .audioCodec("copy")

      .outputOptions([
        "-movflags",
        "+faststart",
      ])

      .on("start", (cmd) => {
        console.log("========== BURN SUBTITLES ==========");
        console.log(cmd);
        console.log("====================================");
      })

      .on("progress", (p) => {
        console.log(
          "Subtitle Burn:",
          p.percent ?? 0
        );
      })

      .on("end", () => {
        console.log("Subtitle burn finished.");
        resolve();
      })

      .on("error", reject)

      .save(output);
  });
}