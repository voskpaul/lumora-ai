import { splitStoryboard } from "../storyboard/scene-splitter";
import { buildStoryboardDirector } from "../storyboard/storyboard-director";

import type { SemanticScene } from "./semantic-scenes";

export type HollywoodRenderScene = {
  id: number;

  narration: string;

  prompt: string;

  duration: number;

  camera: {
    shot: string;
    angle: string;
    lens: string;
    movement: string;
    framing: string;
  };

  subject: {
    appearance: string;
    clothing: string;
  };

  environment: {
    location: string;
    atmosphere: string;
    architecture: string;
    weather: string;
    time: string;
  };
};

export function buildHollywoodRenderScenes(
  scenes: SemanticScene[]
): HollywoodRenderScene[] {

  // keep semantic -> storyboard log
  splitStoryboard(scenes);

  const storyboard = buildStoryboardDirector(scenes);

  const renderScenes: HollywoodRenderScene[] = storyboard.map((scene) => ({

    id: scene.scene.id,

    narration: scene.scene.narration,

    prompt: scene.finalPrompt,

    duration: Math.max(
      2,
      Math.ceil(scene.scene.narration.split(" ").length / 3)
    ),

    camera: {
      shot: scene.shot.shot,
      angle: scene.shot.angle,
      lens: scene.shot.lens,
      movement: scene.shot.movement,
      framing: scene.shot.framing,
    },

    subject: {
      appearance: scene.subject.appearance,
      clothing: scene.subject.clothing,
    },

    environment: {
      location: scene.environment.primaryLocation,
      atmosphere: scene.environment.atmosphere,
      architecture: scene.environment.architecture,
      weather: scene.environment.weather,
      time: scene.environment.timeOfDay,
    },
  }));

  console.log("\n========== HOLLYWOOD RENDER ==========");

  console.table(
    renderScenes.map((scene) => ({
      id: scene.id,
      duration: `${scene.duration}s`,
      shot: scene.camera.shot,
      movement: scene.camera.movement,
    }))
  );

  return renderScenes;
}