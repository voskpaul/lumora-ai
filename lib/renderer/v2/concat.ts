import ffmpeg from "@/lib/ffmpeg";
import fs from "fs";
import path from "path";

type ConcatInput = {
  scenes: string[];
  output: string;
};

export async function concatScenes({
  scenes,
  output,
}: ConcatInput): Promise<void> {

  const listFile = path.join(
    path.dirname(output),
    "concat.txt"
  );

  fs.writeFileSync(
    listFile,
    scenes
      .map(scene => `file '${scene.replace(/\\/g, "/")}'`)
      .join("\n")
  );

  await new Promise<void>((resolve, reject) => {

    ffmpeg()

      .input(listFile)

      .inputOptions([
        "-f concat",
        "-safe 0",
      ])

      .outputOptions([
        "-c copy",
      ])

            .on("start", (cmd) => {
        console.log("========== CONCAT ==========");
        console.log(cmd);
        console.log("============================");
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