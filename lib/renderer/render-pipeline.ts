import {
  buildHollywoodRenderScenes,
  type HollywoodRenderScene,
} from "./hollywood-renderer";

import type { SemanticScene } from "./semantic-scenes";

export type RenderPipelineOutput = {
  scenes: HollywoodRenderScene[];

  totalDuration: number;

  totalScenes: number;
};

export function runRenderPipeline(
  semanticScenes: SemanticScene[]
): RenderPipelineOutput {

  const scenes =
    buildHollywoodRenderScenes(
      semanticScenes
    );

  const totalDuration =
    scenes.reduce(
      (
        sum: number,
        scene: HollywoodRenderScene
      ) => sum + scene.duration,
      0
    );

  return {
    scenes,

    totalDuration,

    totalScenes: scenes.length,
  };
}