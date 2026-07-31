import { buildTimeline } from "./timeline";
import { renderScene } from "./render-scene";
import { concatScenes } from "./concat";

type RenderV2Input = {
  images: string[];
  sceneDurations: number[];
  audioDuration: number;
  output: string;
};

export async function renderV2({
  images,
  sceneDurations,
  audioDuration,
  output,
}: RenderV2Input) {

  const timeline = buildTimeline({

    audioDuration,

    sceneDurations,

    transitionDuration: 0.8,

  });

  console.table(timeline.scenes);

  const sceneFiles: string[] = [];

  for (const scene of timeline.scenes) {

    const file = output.replace(
      ".mp4",
      `-scene-${scene.index}.mp4`
    );

    await renderScene({

      image: images[scene.index],

      scene,

      output: file,

    });

    sceneFiles.push(file);

  }

  await concatScenes({

    scenes: sceneFiles,

    output,

  });

  return timeline;

}