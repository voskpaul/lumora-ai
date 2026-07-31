import { buildCameraMotion } from "./camera-motion";
import type { MotionPreset } from "./cinematic";
import { buildCameraPlan } from "./cinematographer";
import type { ScenePrompt } from "./ai-scene-prompts";
import { buildEditPlan } from "./editor-director";
import { buildMusicPlan } from "./music-director";
import { buildColorPlan } from "./color-director";
import { buildAudioMix } from "./audio-mixer";

export function buildImageFilters(
  sceneDurations: number[],
  scenePrompts: ScenePrompt[]
): string[] {

  const filters: string[] = [];
  const fps = 30;

  for (let i = 0; i < sceneDurations.length; i++) {

    const duration = sceneDurations[i];

    const scene = scenePrompts[i];

    const motion = scene.motion as MotionPreset;

    //--------------------------------------
    // NEW HOLLYWOOD CAMERA MOTION ENGINE
    //--------------------------------------

    const cameraMotion = buildCameraMotion(
  scene.motion,
  duration
);

    //--------------------------------------

    const camera = buildCameraPlan(scene);

    const edit = buildEditPlan(scene);

    const music = buildMusicPlan(scene);

    const audio = buildAudioMix(scene);

    const color = buildColorPlan(scene);

    console.log("Music Plan", {
      scene: i + 1,
      mood: music.mood,
      volume: music.volume,
    });

    console.log("Audio Mix", {
      scene: i + 1,
      music: audio.musicGain,
      narration: audio.narrationGain,
      ducking: audio.ducking,
      fadeIn: audio.fadeIn,
      fadeOut: audio.fadeOut,
    });

    console.log("Color Plan", {
      scene: i + 1,
      saturation: color.saturation,
      contrast: color.contrast,
      brightness: color.brightness,
      gamma: color.gamma,
    });

    console.log("Camera Plan", {
      scene: i + 1,
      boost: scene.cameraBoost,
      zoom: camera.zoomSpeed,
      pan: camera.panSpeed,
      shake: camera.shake,
    });

    //--------------------------------------
    // NEW DEBUG
    //--------------------------------------

    console.log(`Scene ${i + 1}`, {
      motion: scene.motion,
      ffmpeg: cameraMotion.zoompan,
      zoom: camera.zoomSpeed,
      pan: camera.panSpeed,
      shake: camera.shake,
    });

    //--------------------------------------

  filters.push(
  `[${i}:v]` +
    `scale=1080:1920:force_original_aspect_ratio=increase,` +
    `crop=1080:1920,` +
    `${cameraMotion.zoompan},` +
    `eq=` +
    `saturation=${color.saturation}:` +
    `contrast=${color.contrast}:` +
    `brightness=${color.brightness}:` +
    `gamma=${color.gamma},` +
    (edit.vignette ? "vignette," : "") +
    `format=yuv420p,` +
    `trim=duration=${duration},` +
    `setpts=PTS-STARTPTS` +
    `[v${i}]`
);

}

return filters;

}