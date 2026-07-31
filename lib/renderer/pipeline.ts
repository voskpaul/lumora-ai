import { buildImageFilters } from "./filters";
import { transitionFilter } from "./transitions";
import type { ScenePrompt } from "./ai-scene-prompts";

export type PipelineResult = {
  filterComplex: string;
  finalVideoLabel: string;
};

export function buildPipeline(
  sceneDurations: number[],
  scenePrompts: ScenePrompt[]
): PipelineResult {

  const filters: string[] = [];
  const imageCount = sceneDurations.length;

  filters.push(
  ...buildImageFilters(
    sceneDurations,
    scenePrompts
  )
);

  console.log("========== IMAGE FILTERS ==========");
  console.log(filters.join("\n"));
  console.log("===================================");

  let previous = "v0";

  const transitionDuration = 0.8;

  for (let i = 1; i < imageCount; i++) {

    const current = `v${i}`;

    const transition =
      scenePrompts[i].transition;

    const output = `transition${i}`;

    const offset =
      sceneDurations
        .slice(0, i)
        .reduce((a, b) => a + b, 0) -
      transitionDuration;

    filters.push(
      `[${previous}][${current}]xfade=` +
      `transition=${transition}:` +
      `duration=${transitionDuration}:` +
      `offset=${offset}` +
      `[${output}]`
    );

    previous = output;
  }

  return {
    filterComplex: filters.join(";"),
    finalVideoLabel: `[${previous}]`,
  };
}