export type TimelineInput = {
  audioDuration: number;
  sceneDurations: number[];
  transitionDuration: number;
};

export type TimelineScene = {
  index: number;
  duration: number;
  start: number;
  end: number;
};

export type TimelineResult = {
  totalDuration: number;
  transitionDuration: number;
  scenes: TimelineScene[];

  /**
   * Final scene durations after applying the narration-duration policy.
   *
   * These are the durations that were actually used by the renderer.
   * They should be persisted back to Scene.duration so the Timeline
   * Editor and renderer use the same canonical timeline.
   */
  finalDurations: number[];
};

export function buildTimeline({
  audioDuration,
  sceneDurations,
  transitionDuration,
}: TimelineInput): TimelineResult {
  console.log("================================");
  console.log("BUILDING USER TIMELINE");
  console.log("================================");

  console.log("Audio duration:", audioDuration);
  console.log("User scene durations:", sceneDurations);
  console.log("Transition duration:", transitionDuration);

  // -----------------------------------------------------
  // VALIDATION
  // -----------------------------------------------------

  if (!sceneDurations.length) {
    throw new Error(
      "Cannot build timeline without scenes."
    );
  }

  if (
    !Number.isFinite(audioDuration) ||
    audioDuration <= 0
  ) {
    throw new Error(
      `Invalid audio duration: ${audioDuration}`
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

  if (
    transitionDuration >
    Math.min(...sceneDurations)
  ) {
    throw new Error(
      `Transition duration (${transitionDuration}s) cannot exceed the shortest scene duration.`
    );
  }

  for (
    let i = 0;
    i < sceneDurations.length;
    i++
  ) {
    const duration = sceneDurations[i];

    if (
      !Number.isFinite(duration) ||
      duration <= 0
    ) {
      throw new Error(
        `Invalid duration for scene ${i + 1}: ${duration}`
      );
    }
  }

  // -----------------------------------------------------
  // COPY USER DURATIONS
  // -----------------------------------------------------

  /**
   * IMPORTANT:
   *
   * Never mutate the original sceneDurations array.
   *
   * The renderer may need to extend the final scene to make
   * the visual timeline match the narration duration.
   */
  const finalDurations = [
    ...sceneDurations,
  ];

  // -----------------------------------------------------
  // TRANSITION COUNT
  // -----------------------------------------------------

  const transitionCount =
    Math.max(
      finalDurations.length - 1,
      0
    );

  // -----------------------------------------------------
  // CURRENT TIMELINE DURATION
  // -----------------------------------------------------

  /**
   * Every transition overlaps two adjacent scenes.
   *
   * Therefore:
   *
   * timeline =
   * sum(scene durations)
   * -
   * transition overlap
   */
  const currentTimelineDuration =
    finalDurations.reduce(
      (total, duration) =>
        total + duration,
      0
    ) -
    transitionDuration *
      transitionCount;

  console.log(
    "Current timeline duration:",
    currentTimelineDuration
  );

  // -----------------------------------------------------
  // EXTEND FINAL SCENE
  // -----------------------------------------------------

  /**
   * POLICY:
   *
   * Extend the final scene when the narration is longer
   * than the current timeline.
   *
   * This preserves all user-selected scene durations except
   * for the final scene, which absorbs the missing duration.
   */
  if (
    audioDuration >
    currentTimelineDuration
  ) {
    const missingDuration =
      audioDuration -
      currentTimelineDuration;

    console.log(
      "Narration is longer than the current timeline."
    );

    console.log(
      "Extending final scene by:",
      missingDuration
    );

    const lastIndex =
      finalDurations.length - 1;

    finalDurations[lastIndex] +=
      missingDuration;

    console.log(
      "Final scene new duration:",
      finalDurations[lastIndex]
    );
  }

  // -----------------------------------------------------
  // BUILD FINAL SCENES
  // -----------------------------------------------------

  const scenes: TimelineScene[] = [];

  let cursor = 0;

  finalDurations.forEach(
    (duration, index) => {
      const start = cursor;

      const end =
        start + duration;

      scenes.push({
        index,
        duration,
        start,
        end,
      });

      /**
       * The next scene begins before the current scene
       * has completely finished because the transition
       * overlaps the two scenes.
       */
      cursor = end;

      if (
        index !==
        finalDurations.length - 1
      ) {
        cursor -=
          transitionDuration;
      }
    }
  );

  // -----------------------------------------------------
  // FINAL TIMELINE LOGGING
  // -----------------------------------------------------

  console.log("================================");
  console.log(
    "FINAL TIMELINE DURATIONS"
  );
  console.log("================================");

  console.table(
    scenes.map((scene) => ({
      scene: scene.index + 1,

      duration:
        Number(
          scene.duration.toFixed(3)
        ),

      start:
        Number(
          scene.start.toFixed(3)
        ),

      end:
        Number(
          scene.end.toFixed(3)
        ),
    }))
  );

  console.log(
    "Original scene durations:",
    sceneDurations
  );

  console.log(
    "Final render durations:",
    finalDurations
  );

  console.log(
    "Transition count:",
    transitionCount
  );

  console.log(
    "Transition duration:",
    transitionDuration
  );

  console.log(
    "Final timeline duration:",
    cursor
  );

  console.log(
    "Audio duration:",
    audioDuration
  );

  console.log(
    "Duration difference:",
    cursor - audioDuration
  );

  // -----------------------------------------------------
  // TIMING VALIDATION
  // -----------------------------------------------------

  if (
    Math.abs(
      cursor - audioDuration
    ) < 0.05
  ) {
    console.log(
      "SUCCESS: Video timeline matches narration duration."
    );
  } else {
    console.warn(
      "WARNING: Video timeline does not match narration duration."
    );
  }

  console.log("================================");

  // -----------------------------------------------------
  // RETURN
  // -----------------------------------------------------

  return {
    totalDuration: cursor,

    transitionDuration,

    scenes,

    /**
     * This is the critical addition.
     *
     * renderV2() can now return these values to the API
     * route, which can persist them into Scene.duration.
     */
    finalDurations,
  };
}