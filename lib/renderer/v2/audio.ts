import ffmpeg from "@/lib/ffmpeg";

type AudioInput = {
  video: string;
  narration: string;
  output: string;
};

export async function attachNarration({
  video,
  narration,
  output,
}: AudioInput): Promise<void> {

  await new Promise<void>((resolve, reject) => {

    ffmpeg()

      .input(video)

      .input(narration)

      .videoCodec("copy")

      .audioCodec("aac")

      .outputOptions([
        "-map 0:v:0",
        "-map 1:a:0",
        "-shortest",
        "-movflags +faststart",
      ])

      .on("start", (cmd) => {

        console.log("========== AUDIO ==========");
        console.log(cmd);
        console.log("===========================");

      })

      .on("end", () => {
        resolve();
      })

      .on("error", (err) => {
        reject(err);
      })

      .save(output);

  });

}