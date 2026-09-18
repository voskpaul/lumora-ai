import { getAssets } from "../assets";
import { getAudioDuration } from "../timing";
import { prepareASS } from "../subtitles";
import { parseASS } from "../subtitle-parser";
import { buildSemanticScenes } from "../semantic-scenes";
import { applyDirectorTiming } from "../director-timing";

import { buildScenePrompts } from "./ai-scene-prompts";

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
  //---------------------------------------
  // Assets
  //---------------------------------------

  const assets = getAssets(imagesDir);

  //---------------------------------------
  // Audio
  //---------------------------------------

  const audioDuration =
    await getAudioDuration(voicePath);

  //---------------------------------------
  // Captions
  //---------------------------------------

  const captions = prepareASS(
    captionsPath,
    captionsPath
  );

  //---------------------------------------
  // Subtitle Scenes
  //---------------------------------------

  const subtitleScenes =
    parseASS(captions.path);

  //---------------------------------------
  // Semantic Scenes
  //---------------------------------------

  const videoScenes =
    buildSemanticScenes(
      subtitleScenes,
      assets.imageCount
    );

  //---------------------------------------
  // AI Scene Prompts
  //---------------------------------------

  const scenePrompts =
    await buildScenePrompts(videoScenes);

  //---------------------------------------
  // INITIAL DURATIONS
  //---------------------------------------

  const rawDurations =
    videoScenes.map(
      (scene) => scene.duration
    );

  //---------------------------------------
  // DURATION WEIGHTS
  //---------------------------------------

  const sceneWeights =
    scenePrompts.map(
      (scene) => scene.durationWeight
    );

  //---------------------------------------
  // FINAL DIRECTOR TIMING
  //---------------------------------------

  const sceneDurations =
    applyDirectorTiming(
      rawDurations,
      sceneWeights,
      Math.round(audioDuration)
    );

  //---------------------------------------
  // APPLY FINAL DURATIONS
  //---------------------------------------

  const directedScenes =
    scenePrompts.map(
      (scene, index) => {
        const duration =
          sceneDurations[index];

        console.log(
          "🎥 DIRECTOR FINAL MOTION:",
          {
            sceneIndex: index,
            selectedMotion: scene.motion,
            duration,
            emotion: scene.emotion,
            sceneType: scene.sceneType,
          }
        );

        //-----------------------------------
        // Convert V2 ScenePrompt into the
        // shape expected by the existing
        // V1 pipeline.
        //-----------------------------------

        return {
          scene: scene.sceneIndex,

          duration,

          narration:
            videoScenes[index]?.text ??
            scene.prompt,

          imagePrompt:
            scene.prompt,

          motion:
            scene.motion,

          type:
            scene.sceneType,

          transition: "fade",

          emphasis: 1,

          durationWeight:
            scene.durationWeight,

          emotion:
            scene.emotion,

          pauseBefore: false,

          subtitleScale: 1,

          cameraBoost: 1,

          colorGrade:
            scene.colorGrade,
        };
      }
    );

  //---------------------------------------
  // RETURN DIRECTOR PLAN
  //---------------------------------------

  return {
    assets,

    captions,

    subtitleScenes,

    videoScenes,

    scenePrompts: directedScenes,

    rawDurations,

    sceneDurations,

    audioDuration,
  };
}