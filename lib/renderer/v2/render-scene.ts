import ffmpeg from "@/lib/ffmpeg";
import fs from "fs";
import path from "path";

import type { TimelineScene } from "./timeline";

type RenderSceneInput = {
  image: string;
  scene: TimelineScene;
  output: string;
};

export async function renderScene({
  image,
  scene,
  output,
}: RenderSceneInput): Promise<void> {

  await fs.promises.mkdir(
    path.dirname(output),
    { recursive: true }
  );

  const frames = Math.round(scene.duration * 30);

  await new Promise<void>((resolve, reject) => {

    ffmpeg()

      .input(image)

      .inputOptions([
        "-loop 1",
        `-t ${scene.duration}`,
        "-framerate 30",
      ])

      .videoFilters([
        `scale=1080:1920:force_original_aspect_ratio=increase`,
        `crop=1080:1920`,
        `zoompan=` +
          `z='min(zoom+0.0015,1.2)':` +
          `d=${frames}:` +
          `x='iw/2-(iw/zoom/2)':` +
          `y='ih/2-(ih/zoom/2)'`,
        "fps=30",
        "format=yuv420p",
      ])

      .videoCodec("libx264")

      .noAudio()

      .outputOptions([
        "-pix_fmt",
        "yuv420p",
        "-movflags",
        "+faststart",
      ])

      .on("start", cmd => {

        console.log(
          `Rendering scene ${scene.index + 1}`
        );

        console.log(cmd);

      })

      .on("end", () => resolve())

      .on("error", reject)

      .save(output);

  });

}