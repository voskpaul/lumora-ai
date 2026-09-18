import ffmpeg from "@/lib/ffmpeg";
import fs from "fs";
import path from "path";
import { randomTransition } from "./transitions";

type ConcatInput = {
  scenes: string[];
  output: string;
};

export async function concatScenes({
  scenes,
  output,
}: ConcatInput): Promise<void> {

  if (scenes.length === 1) {
    fs.copyFileSync(scenes[0], output);
    return;
  }

  const listFile = path.join(
    path.dirname(output),
    "concat.txt"
  );

  fs.writeFileSync(
    listFile,
    scenes
      .map((s) => `file '${s.replace(/\\/g, "/")}'`)
      .join("\n")
  );

  await new Promise<void>((resolve, reject) => {

    const transition = randomTransition();

console.log(
  "Transition:",
  transition
);

if (scenes.length === 2) {

  ffmpeg()

    .input(scenes[0])

    .input(scenes[1])

    .complexFilter([

      {
        filter: "xfade",
        options: {
          transition,
          duration: 0.8,
          offset: 5,
        },
        inputs: ["0:v", "1:v"],
        outputs: "v",
      },

    ])

    .outputOptions([
      "-map",
      "[v]",
      "-pix_fmt",
      "yuv420p",
      "-preset",
      "veryfast",
      "-crf",
      "20",
    ])

    .on("end", (_stdout, _stderr) => {
  resolve();
})

    .on("error", (err) => {
  reject(err);
})

    .save(output);

} else {

  ffmpeg()

    .input(listFile)

    .inputOptions([
      "-f",
      "concat",
      "-safe",
      "0",
    ])

    .outputOptions([
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-crf",
      "20",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
    ])

    .on("start", cmd => {

      console.log(cmd);

    })

    .on("progress", p => {

      console.log(
        "Concat Progress:",
        p.percent
      );

    })

    .on("end", (_stdout, _stderr) => {
  resolve();
})

    .on("error", reject)

    .save(output);

}
  });

}