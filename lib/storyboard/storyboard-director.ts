import { splitStoryboard } from "./scene-splitter";

import { buildSubjectMemory } from "./subject-memory";
import { buildEnvironmentMemory } from "./environment-memory";
import { buildShotPlan } from "./shot-director";
import { buildContinuityScene } from "./continuity-engine";
import { buildHollywoodDirectorPrompt } from "../hollywood/oscar-director";

import type { SemanticScene } from "../renderer/semantic-scenes";

export function buildStoryboardDirector(
  scenes: SemanticScene[]
) {
  const storyboard = splitStoryboard(scenes);

  return storyboard.map((scene) => {
    const subject = buildSubjectMemory(
      scene.subject
    );

    const environment =
      buildEnvironmentMemory(
        scene.location
      );

    const shot = buildShotPlan(scene);

    const continuity =
      buildContinuityScene(
        scene,
        subject,
        environment,
        shot
      );

    const finalPrompt =
  buildHollywoodDirectorPrompt(
    continuity,
    scene.narration
  );

    return {
      ...continuity,
      finalPrompt,
    };
  });
}