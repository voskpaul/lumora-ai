import ffmpeg from "@/lib/ffmpeg";

import fs from "fs";

import { createSlideshow } from "./slideshow";

import { getAudioDuration } from "./timing";


type RenderInput = {

  videoId: string;

  imagesDir: string;

  voicePath: string;

  captionsPath: string;

  outputPath: string;

};





export async function renderVideo({

  imagesDir,

  voicePath,

  captionsPath,

  outputPath,

}: RenderInput): Promise<void> {

  if (!fs.existsSync(voicePath)) {

    throw new Error("Voice file missing.");

  }





  if (!fs.existsSync(captionsPath)) {

    throw new Error("Captions file missing.");

  }





  const totalDuration = await getAudioDuration(voicePath);





  const imagesTxt = await createSlideshow(

    imagesDir,

    totalDuration

  );





  console.log("Images list:", imagesTxt);

  console.log("Voice:", voicePath);

  console.log("Captions:", captionsPath);

  console.log("Output:", outputPath);





  const escapedCaptions = captionsPath

    .replace(/\\/g, "/")

    .replace(/:/g, "\\:")

    .replace(/'/g, "\\'");





  await new Promise<void>((resolve, reject) => {

    ffmpeg()

      .input(imagesTxt)

.inputOptions([

  "-f concat",

  "-safe 0",

])



.input(voicePath)



.videoFilters([

  "zoompan=z='min(zoom+0.0008,1.15)':d=175:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920:fps=25",

  `subtitles='${escapedCaptions}'`,

])

     

      .videoFilters(

  `subtitles='${escapedCaptions}'`

)

.videoCodec("libx264")

.audioCodec("aac")

.outputOptions([

  "-pix_fmt",

  "yuv420p",

  "-shortest",

])

      .on("start", (cmd) => {

        console.log("========== FFMPEG COMMAND ==========");

        console.log(cmd);

        console.log("====================================");

      })

      .on("end", () => {

        console.log("✅ Render complete");

        resolve();

      })

      .on("error", (err, stdout, stderr) => {

        console.error("❌ FFMPEG ERROR");

        console.error(err);





        console.log("========== STDOUT ==========");

        console.log(stdout);





        console.log("========== STDERR ==========");

        console.log(stderr);





        reject(err);

      })

      .save(outputPath);

  });

}

