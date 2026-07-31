import path from "path";
import fs from "fs";

import { buildTimeline } from "./timeline";
import { renderScene } from "./render-scene";
import { concatScenes } from "./concat";
import { attachNarration } from "./audio";

type RenderInput = {
  images: string[];
  sceneDurations: number[];
  audioDuration: number;
  narration: string;
  workingDir: string;
  output: string;
};

export async function renderV2({
  images,
  sceneDurations,
  audioDuration,
  narration,
  workingDir,
  output,
}: RenderInput) {

  const scenesDir = path.join(
    workingDir,
    "scenes"
  );

  fs.mkdirSync(scenesDir, {
    recursive: true,
  });

  //---------------------------------------
  // TIMELINE
  //---------------------------------------

  const timeline = buildTimeline({

    audioDuration,

    sceneDurations,

    transitionDuration: 0.8,

  });

  console.log("========== TIMELINE ==========");

  console.table(timeline.scenes);

  console.log(
    "Timeline total:",
    timeline.totalDuration
  );

  console.log("==============================");

  //---------------------------------------
  // SCENE RENDER
  //---------------------------------------

  const renderedScenes: string[] = [];

  for (const scene of timeline.scenes) {

    const sceneFile = path.join(
      scenesDir,
      `scene-${scene.index}.mp4`
    );

    console.log(
      `Rendering scene ${scene.index + 1}/${timeline.scenes.length}`
    );

    await renderScene({

      image: images[scene.index],

      scene,

      output: sceneFile,

    });

    renderedScenes.push(sceneFile);

  }

  //---------------------------------------
  // CONCAT
  //---------------------------------------

  const movie = path.join(
    workingDir,
    "movie.mp4"
  );

  console.log("Concatenating scenes...");

  await concatScenes({

    scenes: renderedScenes,

    output: movie,

  });

  //---------------------------------------
  // AUDIO
  //---------------------------------------

  console.log("Attaching narration...");

  await attachNarration({

    video: movie,

    narration,

    output,

  });

  //---------------------------------------

  console.log("========== DONE ==========");

  console.log(output);

}