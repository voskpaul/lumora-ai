import ffmpeg from "@/lib/ffmpeg";

export type TransitionType =
  | "fade"
  | "slide"
  | "zoom"
  | "none";

export type SceneTransition = {
  transitionType?: TransitionType;
  transitionDuration?: number;
};

type XFadeInput = {
  scenes: string[];
  sceneDurations?: number[];
  transitions?: SceneTransition[];
  output: string;
  transitionDuration?: number;
};

const DEFAULT_TRANSITION_DURATION = 0.8;

const TRANSITION_MAP: Record<
  Exclude<TransitionType, "none">,
  string
> = {
  fade: "fade",
  slide: "smoothleft",
  zoom: "zoomin",
};

async function probeDuration(file: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(file, (err, data) => {
      if (err) return reject(err);

      const duration = Number(data.format.duration);

      if (!Number.isFinite(duration) || duration <= 0) {
        return reject(
          new Error(`Invalid scene duration for ${file}: ${duration}`)
        );
      }

      resolve(duration);
    });
  });
}

function normalizeTransition(
  transition: SceneTransition | undefined,
  fallbackDuration: number
) {
  const type: TransitionType =
    transition?.transitionType ?? "fade";

  const durationValue = Number(
    transition?.transitionDuration ?? fallbackDuration
  );

  const duration =
    Number.isFinite(durationValue) && durationValue >= 0
      ? durationValue
      : fallbackDuration;

  return {
    type,
    duration,
  };
}

export async function xfadeScenes({
  scenes,
  sceneDurations,
  transitions,
  output,
  transitionDuration = DEFAULT_TRANSITION_DURATION,
}: XFadeInput): Promise<void> {
  if (scenes.length === 0) {
    throw new Error("No scenes provided to xfadeScenes");
  }

  if (scenes.length === 1) {
    console.log(
      "Only one scene supplied. No XFade required."
    );

    return new Promise<void>((resolve, reject) => {
      ffmpeg(scenes[0])
        .outputOptions([
          "-c:v",
          "copy",
          "-an",
          "-movflags",
          "+faststart",
        ])
        .on("start", (cmdLine) => {
          console.log("========== SINGLE SCENE COPY ==========");
          console.log(cmdLine);
          console.log("=======================================");
        })
        .on("end", () => resolve())
        .on("error", reject)
        .save(output);
    });
  }

  if (
    !sceneDurations ||
    sceneDurations.length !== scenes.length
  ) {
    throw new Error(
      `XFade requires sceneDurations for every scene. ` +
        `Received ${sceneDurations?.length ?? 0} durations for ` +
        `${scenes.length} scenes.`
    );
  }

  const plannedDurations = sceneDurations.map(Number);

  plannedDurations.forEach((duration, index) => {
    if (!Number.isFinite(duration) || duration <= 0) {
      throw new Error(
        `Invalid planned duration for scene ${index + 1}: ${duration}`
      );
    }
  });

  const transitionSettings = Array.from(
    { length: scenes.length - 1 },
    (_, index) =>
      normalizeTransition(
        transitions?.[index],
        transitionDuration
      )
  );

  console.log(
    "\n========== TRANSITION SETTINGS =========="
  );

  transitionSettings.forEach((setting, index) => {
    console.log({
      boundary: `${index + 1} → ${index + 2}`,
      transitionType: setting.type,
      transitionDuration: setting.duration,
    });
  });

  console.log("==========================================");

  console.log(
    "\n========== ACTUAL SCENE DURATIONS =========="
  );

  const actualDurations: number[] = [];

  for (let i = 0; i < scenes.length; i++) {
    const duration = await probeDuration(scenes[i]);

    actualDurations.push(duration);

    console.log(
      `Scene ${i + 1}: ${duration.toFixed(3)}s`
    );
  }

  console.log(
    "============================================"
  );

  console.log(
    "\n========== TIMELINE COMPARISON =========="
  );

  plannedDurations.forEach((planned, index) => {
    const actual = actualDurations[index];

    console.log({
      scene: index + 1,
      planned: Number(planned.toFixed(3)),
      actual: Number(actual.toFixed(3)),
      difference: Number(
        (actual - planned).toFixed(3)
      ),
    });
  });

  console.log(
    "========================================="
  );

  /*
   * Use actual rendered durations for transition offsets.
   *
   * This preserves the timing behavior that was already
   * verified before Step 4.
   */
  const durations = actualDurations;

  const filters: string[] = [];

  for (let i = 0; i < scenes.length; i++) {
    filters.push(
      `[${i}:v]` +
        `settb=AVTB,` +
        `setpts=PTS-STARTPTS` +
        `[v${i}]`
    );
  }

  let accumulated = durations[0];

  for (let i = 0; i < scenes.length - 1; i++) {
    const setting = transitionSettings[i];

    const inputA =
      i === 0
        ? "[v0]"
        : `[xf${i}]`;

    const inputB = `[v${i + 1}]`;

    const outputLabel = `[xf${i + 1}]`;

    /*
     * NONE means a hard cut.
     *
     * No overlap is consumed at this boundary.
     */
    if (
      setting.type === "none" ||
      setting.duration === 0
    ) {
      const cutDuration = durations[i];

      filters.push(
        `${inputA}${inputB}` +
          `concat=n=2:v=1:a=0` +
          `${outputLabel}`
      );

      console.log(
        "\n========== TRANSITION =========="
      );

      console.log({
        fromScene: i + 1,
        toScene: i + 2,
        transition: "none",
        duration: 0,
        offset: Number(
          accumulated.toFixed(3)
        ),
        timelineEffect: "hard cut",
      });

      console.log(
        "================================"
      );

      /*
       * A concat filter starts the second stream after the
       * first stream finishes, so the accumulated timeline
       * grows by the full duration of scene i+1.
       */
      accumulated += durations[i + 1];

      continue;
    }

    const ffmpegTransition =
      TRANSITION_MAP[setting.type];

    if (!ffmpegTransition) {
      throw new Error(
        `Unsupported transition type at boundary ${
          i + 1
        } → ${i + 2}: ${setting.type}`
      );
    }

    if (setting.duration >= durations[i]) {
      throw new Error(
        `Transition duration ${setting.duration}s at boundary ${
          i + 1
        } → ${i + 2} must be shorter than scene ${
          i + 1
        } duration ${durations[i].toFixed(3)}s.`
      );
    }

    if (setting.duration >= durations[i + 1]) {
      throw new Error(
        `Transition duration ${setting.duration}s at boundary ${
          i + 1
        } → ${i + 2} must be shorter than scene ${
          i + 2
        } duration ${durations[i + 1].toFixed(3)}s.`
      );
    }

    const offset = Math.max(
      0,
      accumulated - setting.duration
    );

    console.log(
      "\n========== TRANSITION =========="
    );

    console.log({
      fromScene: i + 1,
      toScene: i + 2,
      transition: setting.type,
      ffmpegTransition,
      duration: setting.duration,
      offset: Number(
        offset.toFixed(3)
      ),
    });

    console.log(
      "================================"
    );

    filters.push(
      `${inputA}${inputB}` +
        `xfade=` +
        `transition=${ffmpegTransition}:` +
        `duration=${setting.duration}:` +
        `offset=${offset}` +
        `${outputLabel}`
    );

    accumulated +=
      durations[i + 1] - setting.duration;
  }

  const finalLabel =
    `[xf${scenes.length - 1}]`;

  const totalTransitionOverlap =
    transitionSettings.reduce(
      (total, setting) =>
        total +
        (setting.type === "none"
          ? 0
          : setting.duration),
      0
    );

  const expectedDuration =
    durations.reduce(
      (total, duration) =>
        total + duration,
      0
    ) -
    totalTransitionOverlap;

  console.log(
    "\n========== FINAL TIMELINE =========="
  );

  console.log(
    "Transition settings:",
    transitionSettings
  );

  console.log(
    "Total transition overlap:",
    totalTransitionOverlap.toFixed(3)
  );

  console.log(
    "Expected movie duration:",
    expectedDuration.toFixed(3)
  );

  console.log(
    "Calculated accumulated duration:",
    accumulated.toFixed(3)
  );

  console.log(
    "Final filter label:",
    finalLabel
  );

  console.log(
    "===================================="
  );

  return new Promise<void>((resolve, reject) => {
    const command = ffmpeg();

    scenes.forEach((scene) => {
      command.input(scene);
    });

    command.complexFilter(filters);

    command.outputOptions([
      "-map",
      finalLabel,
      "-an",
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-crf",
      "20",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
    ]);

    command
      .on("start", (cmdLine) => {
        console.log(
          "\n========== XFADE FFMPEG =========="
        );
        console.log(cmdLine);
        console.log(
          "=================================="
        );
      })
      .on("progress", (progress) => {
        console.log(
          "XFade:",
          progress.percent ?? 0
        );
      })
      .on("end", async () => {
        try {
          const actualMovieDuration =
            await probeDuration(output);

          console.log(
            "\n========== XFADE RESULT =========="
          );

          console.log(
            "Expected duration:",
            expectedDuration.toFixed(3)
          );

          console.log(
            "Actual duration:",
            actualMovieDuration.toFixed(3)
          );

          console.log(
            "Difference:",
            (
              actualMovieDuration -
              expectedDuration
            ).toFixed(3)
          );

          console.log(
            "=================================="
          );

          resolve();
        } catch (error) {
          reject(error);
        }
      })
      .on(
        "error",
        (err, stdout, stderr) => {
          console.error(
            "\n========== XFADE ERROR =========="
          );
          console.error("ERROR:");
          console.error(err);
          console.error("\n========== STDERR ==========");
          console.error(stderr);
          console.error("\n========== STDOUT ==========");
          console.error(stdout);
          console.error(
            "================================"
          );
          reject(err);
        }
      )
      .save(output);
  });
}
