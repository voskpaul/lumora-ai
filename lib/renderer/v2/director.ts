import { prisma } from "@/lib/prisma";

import { getAssets } from "../assets";
import { getAudioDuration } from "../timing";
import { prepareASS } from "../subtitles";
import { parseASS } from "../subtitle-parser";
import { buildSemanticScenes } from "../semantic-scenes";
import { applyDirectorTiming } from "../director-timing";
import { buildScenePrompts } from "./ai-scene-prompts";

type DirectorInput = {
  videoId: string;
  imagesDir: string;
  voicePath: string;
  captionsPath: string;
};

export async function buildDirectorPlan({
  videoId,
  imagesDir,
  voicePath,
  captionsPath,
}: DirectorInput) {
  const assets = getAssets(imagesDir);
  const audioDuration = await getAudioDuration(voicePath);
  const captions = prepareASS(captionsPath, captionsPath);
  const subtitleScenes = parseASS(captions.path);
  const videoScenes = buildSemanticScenes(
    subtitleScenes,
    assets.imageCount
  );
  const scenePrompts = await buildScenePrompts(videoScenes);

  const rawDurations = videoScenes.map(
    (scene) => scene.duration
  );

  const sceneWeights = scenePrompts.map(
    (scene) => scene.durationWeight
  );

  const sceneDurations = applyDirectorTiming(
    rawDurations,
    sceneWeights,
    Math.round(audioDuration)
  );

  const savedScenes = await prisma.scene.findMany({
    where: { videoId },
    select: {
      id: true,
      order: true,
      motionOverride: true,
    },
    orderBy: { order: "asc" },
  });

  const directedScenes = scenePrompts.map(
    (scene, index) => {
      const savedScene = savedScenes[index];
      const finalMotion =
        savedScene?.motionOverride ?? scene.motion;

      const duration = sceneDurations[index];

      console.log("DIRECTOR FINAL MOTION:", {
        sceneIndex: index,
        automaticMotion: scene.motion,
        manualOverride: savedScene?.motionOverride ?? null,
        selectedMotion: finalMotion,
        duration,
        emotion: scene.emotion,
        sceneType: scene.sceneType,
      });

      return {
        scene: scene.sceneIndex,
        duration,
        narration: videoScenes[index]?.text ?? scene.prompt,
        imagePrompt: scene.prompt,
        motion: finalMotion,
        type: scene.sceneType,
        transition: "fade",
        emphasis: 1,
        durationWeight: scene.durationWeight,
        emotion: scene.emotion,
        pauseBefore: false,
        subtitleScale: 1,
        cameraBoost: 1,
        colorGrade: scene.colorGrade,
      };
    }
  );

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
