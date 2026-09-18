import { buildImageFilters } from "./filters";
import type { ScenePrompt } from "./ai-scene-prompts";

export type PipelineResult = {
  filterComplex: string;
  finalVideoLabel: string;
};

const TRANSITIONS = [
  "fade",
  "smoothleft",
  "smoothright",
  "smoothup",
  "smoothdown",
  "fadeblack",
  "fadewhite",
];

function selectTransition(index: number): string {
  return TRANSITIONS[index % TRANSITIONS.length];
}

export function buildPipeline(
  sceneDurations: number[],
  scenePrompts: ScenePrompt[],
  transitionDuration: number
): PipelineResult {
  const filters: string[] = [];

  const imageCount = sceneDurations.length;

  if (imageCount === 0) {
    throw new Error(
      "Cannot build video pipeline: no scenes available."
    );
  }

  if (scenePrompts.length !== imageCount) {
    throw new Error(
      `Scene mismatch: ${imageCount} durations but ${scenePrompts.length} scene prompts.`
    );
  }

  if (
    !Number.isFinite(transitionDuration) ||
    transitionDuration < 0
  ) {
    throw new Error(
      `Invalid transition duration: ${transitionDuration}`
    );
  }

  // =====================================================
  // IMAGE FILTERS
  // =====================================================

  filters.push(
    ...buildImageFilters(
      sceneDurations,
      scenePrompts
    )
  );

  console.log(
    "========== IMAGE FILTERS =========="
  );

  console.log(
    filters.join("\n")
  );

  console.log(
    "Transition duration:",
    transitionDuration
  );

  console.log(
    "==================================="
  );

  // =====================================================
  // TRANSITIONS
  // =====================================================

  let previous = "v0";

  let accumulatedDuration =
    sceneDurations[0];

  for (
    let i = 1;
    i < imageCount;
    i++
  ) {
    const current = `v${i}`;

    const transition =
      selectTransition(i - 1);

    const output =
      `transition${i}`;

    /*
     * Transition begins before the
     * previous timeline ends.
     */
    const offset =
      accumulatedDuration -
      transitionDuration;

    filters.push(
      `[${previous}][${current}]` +
        `xfade=` +
        `transition=${transition}:` +
        `duration=${transitionDuration}:` +
        `offset=${offset}` +
        `[${output}]`
    );

    console.log(
      `Transition ${i}`
    );

    console.log({
      transition,
      duration:
        transitionDuration,
      offset,
    });

    /*
     * Update the actual accumulated
     * timeline duration.
     *
     * Scenes overlap during transitions.
     */
    accumulatedDuration +=
      sceneDurations[i] -
      transitionDuration;

    previous = output;
  }

  console.log(
    "========== PIPELINE TIMING =========="
  );

  console.log(
    "Final timeline duration:",
    accumulatedDuration
  );

  console.log(
    "====================================="
  );

  return {
    filterComplex:
      filters.join(";"),

    finalVideoLabel:
      `[${previous}]`,
  };
}