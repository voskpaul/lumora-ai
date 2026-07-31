import { getAssets } from "../assets";
import { getAudioDuration } from "../timing";
import { prepareASS } from "../subtitles";

import { parseASS } from "../subtitle-parser";
import { buildSemanticScenes } from "../semantic-scenes";
import { buildScenePrompts } from "../ai-scene-prompts";
import { applyDirectorTiming } from "../director-timing";

type DirectorInput = {
  imagesDir: string;
  voicePath: string;
  captionsPath: string;
};

export async function buildDirectorPlan({
  imagesDir,
  voicePath,
  captionsPath,
}: DirectorInput) {

  const assets = getAssets(imagesDir);

  const audioDuration =
    await getAudioDuration(voicePath);

  const captions = prepareASS(
    captionsPath,
    captionsPath
  );

  const subtitleScenes =
    parseASS(captions.path);

  const videoScenes =
    buildSemanticScenes(
      subtitleScenes,
      assets.imageCount
    );

  const scenePrompts =
    await buildScenePrompts(videoScenes);

  const rawDurations =
    videoScenes.map(
      scene => scene.duration
    );

  const sceneWeights =
    scenePrompts.map(
      scene => scene.durationWeight
    );

  const sceneDurations =
    applyDirectorTiming(
      rawDurations,
      sceneWeights,
      Math.round(audioDuration)
    );

  return {

    assets,

    captions,

    subtitleScenes,

    videoScenes,

    scenePrompts,

    rawDurations,

    sceneDurations,

    audioDuration,

  };

}