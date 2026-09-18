import path from "path";
import fs from "fs";

import { snapTimelineToBeats } from "./beat-sync";
import { chooseMusic } from "./music-selector";
import { detectBeats } from "./python-beats";
import {
  applyCinematicEffectsAndSubtitles,
} from "./effects";
import ffmpeg from "@/lib/ffmpeg";
import {
  xfadeScenes,
  type SceneTransition,
} from "./xfade";
import { buildDirectorPlan } from "./director";
import { renderScene } from "./render-scene";
import { attachNarration } from "./audio";
import { attachBackgroundMusic } from "./music";

export type RenderInput = {
  imagesDir: string;
  voicePath: string;
  captionsPath: string;
  workingDir: string;
  output: string;
  timelineSceneDurations: number[];
  timelineTransitions?: SceneTransition[];
};

type TimelineScene = {
  index: number;
  duration: number;
  start: number;
  end: number;
};

type TransitionAwareTimeline = {
  totalDuration: number;
  scenes: TimelineScene[];
  finalDurations: number[];
  transitionDuration: number;
};

function buildTransitionAwareTimeline({
  audioDuration,
  sceneDurations,
  transitions,
  fallbackTransitionDuration,
}: {
  audioDuration: number;
  sceneDurations: number[];
  transitions: SceneTransition[];
  fallbackTransitionDuration: number;
}): TransitionAwareTimeline {
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
    !Number.isFinite(
      fallbackTransitionDuration
    ) ||
    fallbackTransitionDuration < 0
  ) {
    throw new Error(
      `Invalid fallback transition duration: ${fallbackTransitionDuration}`
    );
  }

  const finalDurations =
    sceneDurations.map(Number);

  finalDurations.forEach(
    (
      duration: number,
      index: number
    ) => {
      if (
        !Number.isFinite(duration) ||
        duration <= 0
      ) {
        throw new Error(
          `Invalid duration for scene ${
            index + 1
          }: ${duration}`
        );
      }
    }
  );

  const boundaryTransitions =
    Array.from(
      {
        length: Math.max(
          finalDurations.length - 1,
          0
        ),
      },
      (
        _unused: unknown,
        index: number
      ) => {
        const transition =
          transitions[index];

        const type =
          transition?.transitionType ??
          "fade";

        const durationValue =
          Number(
            transition?.transitionDuration ??
              fallbackTransitionDuration
          );

        const duration =
          Number.isFinite(
            durationValue
          ) &&
          durationValue >= 0
            ? durationValue
            : fallbackTransitionDuration;

        if (
          type !== "none" &&
          duration >
            Math.min(
              finalDurations[index],
              finalDurations[
                index + 1
              ]
            )
        ) {
          throw new Error(
            `Transition duration ${duration}s at boundary ${
              index + 1
            } → ${
              index + 2
            } cannot exceed either adjacent scene duration.`
          );
        }

        return {
          type,
          duration:
            type === "none"
              ? 0
              : duration,
        };
      }
    );

  const calculateDuration =
    () =>
      finalDurations.reduce(
        (
          total: number,
          duration: number
        ) =>
          total + duration,
        0
      ) -
      boundaryTransitions.reduce(
        (
          total: number,
          transition: {
            type: string;
            duration: number;
          }
        ) =>
          total +
          transition.duration,
        0
      );

  const currentTimelineDuration =
    calculateDuration();

  if (
    audioDuration >
    currentTimelineDuration
  ) {
    const missingDuration =
      audioDuration -
      currentTimelineDuration;

    const lastIndex =
      finalDurations.length - 1;

    finalDurations[lastIndex] +=
      missingDuration;
  }

  const scenes: TimelineScene[] =
    [];

  let cursor = 0;

  finalDurations.forEach(
    (
      duration: number,
      index: number
    ) => {
      const start = cursor;
      const end =
        start + duration;

      scenes.push({
        index,
        duration,
        start,
        end,
      });

      cursor = end;

      if (
        index !==
        finalDurations.length - 1
      ) {
        cursor -=
          boundaryTransitions[
            index
          ].duration;
      }
    }
  );

  return {
    totalDuration: cursor,
    scenes,
    finalDurations,

    // Fallback value retained for
    // compatibility with xfadeScenes.
    // Actual boundary durations come
    // from the transitions array.
    transitionDuration:
      fallbackTransitionDuration,
  };
}

function now() {
  return process.hrtime.bigint();
}

function secondsSince(
  start: bigint
) {
  return (
    Number(
      process.hrtime.bigint() -
        start
    ) /
    1_000_000_000
  );
}

function logStage(
  name: string,
  start: bigint
) {
  const seconds =
    secondsSince(start);

  console.log(
    `⏱️ ${name}: ${seconds.toFixed(
      2
    )}s`
  );

  return seconds;
}

async function probe(
  file: string
) {
  return new Promise<number>(
    (
      resolve,
      reject
    ) => {
      ffmpeg.ffprobe(
        file,
        (
          err,
          data
        ) => {
          if (err) {
            return reject(err);
          }

          resolve(
            Number(
              data.format
                .duration
            )
          );
        }
      );
    }
  );
}

export async function renderV2({
  imagesDir,
  voicePath,
  captionsPath,
  workingDir,
  output,
  timelineSceneDurations,
  timelineTransitions,
}: RenderInput) {
  const totalStart =
    now();

  console.log(
    "\n=========================================="
  );

  console.log(
    "🎬 RENDER V2 — PERFORMANCE PROFILING"
  );

  console.log(
    "=========================================="
  );

  console.log(
    "Images:",
    imagesDir
  );

  console.log(
    "Voice:",
    voicePath
  );

  console.log(
    "Captions:",
    captionsPath
  );

  console.log(
    "Working directory:",
    workingDir
  );

  console.log(
    "Output:",
    output
  );

  fs.mkdirSync(
    workingDir,
    {
      recursive: true,
    }
  );

  // =====================================================
  // 1. DIRECTOR
  // =====================================================

  console.log(
    "\n========== 1. DIRECTOR =========="
  );

  const directorStart =
    now();

  const director =
    await buildDirectorPlan({
      imagesDir,
      voicePath,
      captionsPath,
    });

  const directorTime =
    logStage(
      "DIRECTOR PLAN",
      directorStart
    );

  const {
    assets,
    sceneDurations:
      directorSceneDurations,
    audioDuration,
    scenePrompts,
  } = director;

  const sceneDurations =
    timelineSceneDurations.length >
    0
      ? timelineSceneDurations
      : directorSceneDurations;

  console.log(
    "================================"
  );

  console.log(
    "TIMELINE DURATIONS"
  );

  console.log(
    "================================"
  );

  console.log(
    "Saved Timeline Durations:",
    timelineSceneDurations
  );

  console.log(
    "Director Durations:",
    directorSceneDurations
  );

  console.log(
    "Renderer Using:",
    sceneDurations
  );

  console.log(
    "================================"
  );

  console.log(
    "Scenes:",
    sceneDurations.length
  );

  console.log(
    "Audio duration:",
    audioDuration
  );

  // =====================================================
  // 2. MUSIC + BEAT DETECTION
  // =====================================================

  console.log(
    "\n========== 2. MUSIC =========="
  );

  const musicStart =
    now();

  const musicPath =
    chooseMusic(
      scenePrompts[0]
        ?.colorGrade
    );

  console.log(
    "Music selected:",
    musicPath
  );

  const beats =
    await detectBeats(
      musicPath
    );

  console.log(
    "Detected beats:",
    beats.length
  );

  console.log(
    "First beats:",
    beats.slice(
      0,
      20
    )
  );

  const musicTime =
    logStage(
      "MUSIC + BEAT DETECTION",
      musicStart
    );

  // =====================================================
  // 3. BEAT SYNC
  // =====================================================

  console.log(
    "\n========== 3. BEAT SYNC =========="
  );

  const beatStart =
    now();

  /*
   * Keep the existing timeline
   * durations unchanged here.
   *
   * Beat sync can be expanded later
   * without changing the transition
   * system.
   */
  const beatSyncedDurations =
    sceneDurations;

  console.log(
    "Original durations:",
    sceneDurations
  );

  console.log(
    "Beat synced durations:",
    beatSyncedDurations
  );

  const beatTime =
    logStage(
      "BEAT SYNC",
      beatStart
    );

  // =====================================================
  // 4. TIMELINE
  // =====================================================

  console.log(
    "\n========== 4. TIMELINE =========="
  );

  const timelineStart =
    now();

  const timeline =
    buildTransitionAwareTimeline({
      audioDuration,

      sceneDurations:
        beatSyncedDurations,

      transitions:
        timelineTransitions ??
        [],

      fallbackTransitionDuration:
        0.8,
    });

  console.table(
    timeline.scenes
  );

  console.log(
    "Timeline total:",
    timeline.totalDuration
  );

  console.log(
    "Timeline transitions:",
    timelineTransitions
  );

  const timelineTime =
    logStage(
      "TIMELINE BUILD",
      timelineStart
    );

  // =====================================================
  // 5. SCENE RENDERING
  // =====================================================

  console.log(
    "\n========== 5. SCENE RENDERING =========="
  );

  const scenesStart =
    now();

  const scenesDir =
    path.join(
      workingDir,
      "scenes"
    );

  fs.mkdirSync(
    scenesDir,
    {
      recursive: true,
    }
  );

  const renderedScenes:
    string[] = [];

  const individualSceneTimes:
    number[] = [];

  for (
    let i = 0;
    i <
    timeline.scenes.length;
    i++
  ) {
    const scene =
      timeline.scenes[i];

    const sceneFile =
      path.join(
        scenesDir,
        `scene-${i}.mp4`
      );

    console.log(
      "\n------------------------------------------"
    );

    console.log(
      `🎬 SCENE ${
        i + 1
      }/${timeline.scenes.length}`
    );

    console.log(
      "------------------------------------------"
    );

    console.log(
      "Camera:",
      scenePrompts[i]
        ?.motion
    );

    console.log(
      "Color grade:",
      scenePrompts[i]
        ?.colorGrade
    );

    console.log({
      sceneIndex: i,

      timelineDuration:
        scene.duration,

      originalDuration:
        sceneDurations[i],

      beatSyncedDuration:
        beatSyncedDurations[i],

      start:
        scene.start,

      end:
        scene.end,
    });

    const sceneStart =
      now();

    await renderScene({
      image:
        assets.images[i],

      duration:
        scene.duration,

      motion:
        scenePrompts[i].motion,

      colorGrade:
        scenePrompts[i]
          .colorGrade,

      output:
        sceneFile,
    });

    const sceneTime =
      logStage(
        `SCENE ${
          i + 1
        } RENDER`,
        sceneStart
      );

    individualSceneTimes.push(
      sceneTime
    );

    renderedScenes.push(
      sceneFile
    );
  }

  const scenesTime =
    logStage(
      "ALL SCENES",
      scenesStart
    );

  console.log(
    "\n========== SCENE TIMINGS =========="
  );

  individualSceneTimes.forEach(
    (
      time: number,
      index: number
    ) => {
      console.log(
        `Scene ${
          index + 1
        }: ${time.toFixed(
          2
        )}s`
      );
    }
  );

  console.log(
    "=================================="
  );

  // =====================================================
  // 6. SCENE PROBING
  // =====================================================

  console.log(
    "\n========== 6. SCENE PROBING =========="
  );

  const probeStart =
    now();

  for (
    let i = 0;
    i <
    renderedScenes.length;
    i++
  ) {
    const scene =
      renderedScenes[i];

    const duration =
      await probe(scene);

    console.log(
      `Scene ${
        i + 1
      }: ${duration.toFixed(
        3
      )}s`
    );
  }

  const probeTime =
    logStage(
      "SCENE FFPROBE",
      probeStart
    );

  // =====================================================
  // 7. XFADE
  // =====================================================

  console.log(
    "\n========== 7. XFADE =========="
  );

  const movie =
    path.join(
      workingDir,
      "movie.mp4"
    );

  const xfadeStart =
    now();

  await xfadeScenes({
    scenes:
      renderedScenes,

    sceneDurations:
      timeline.scenes.map(
        (
          scene: TimelineScene
        ): number =>
          scene.duration
      ),

    transitions:
      timelineTransitions,

    /*
     * Fallback transition duration.
     *
     * Individual transition durations
     * are supplied through `transitions`.
     */
    transitionDuration:
      timeline.transitionDuration,

    output:
      movie,
  });

  const xfadeTime =
    logStage(
      "XFADE / SCENE CONCATENATION",
      xfadeStart
    );

  if (
    !fs.existsSync(movie)
  ) {
    throw new Error(
      `XFade completed but movie was not created: ${movie}`
    );
  }

  console.log(
    "Movie created:",
    movie
  );

  // =====================================================
  // 8. MOVIE PROBE
  // =====================================================

  console.log(
    "\n========== 8. MOVIE PROBE =========="
  );

  const movieProbeStart =
    now();

  await new Promise<void>(
    (
      resolve,
      reject
    ) => {
      ffmpeg.ffprobe(
        movie,
        (
          err,
          data
        ) => {
          if (err) {
            return reject(err);
          }

          console.log(
            "Movie duration:",
            data.format
              .duration
          );

          console.log(
            "Video duration:",
            data.streams?.[0]
              ?.duration
          );

          console.log(
            "Frames:",
            data.streams?.[0]
              ?.nb_frames
          );

          resolve();
        }
      );
    }
  );

  const movieProbeTime =
    logStage(
      "FINAL MOVIE FFPROBE",
      movieProbeStart
    );

  // =====================================================
  // 9. NARRATION
  // =====================================================

  console.log(
    "\n========== 9. NARRATION =========="
  );

  const narratedMovie =
    path.join(
      workingDir,
      "movie-audio.mp4"
    );

  const narrationStart =
    now();

  /*
   * Cinematic effects are no longer
   * applied here.
   *
   * The movie remains untouched until
   * the final video encode where effects
   * and subtitles are applied together.
   */

  await attachNarration({
    video:
      movie,

    narration:
      voicePath,

    output:
      narratedMovie,
  });

  const narrationTime =
    logStage(
      "NARRATION",
      narrationStart
    );

  if (
    !fs.existsSync(
      narratedMovie
    )
  ) {
    throw new Error(
      `Narration completed but output was not created: ${narratedMovie}`
    );
  }

  // =====================================================
  // 10. BACKGROUND MUSIC
  // =====================================================

  console.log(
    "\n========== 10. BACKGROUND MUSIC =========="
  );

  const finalMovie =
    path.join(
      workingDir,
      "movie-final.mp4"
    );

  const musicAttachStart =
    now();

  /*
   * Background music stage should copy
   * the existing video stream.
   *
   * No video re-encoding here.
   */

  await attachBackgroundMusic({
    video:
      narratedMovie,

    narration:
      voicePath,

    music:
      musicPath,

    output:
      finalMovie,
  });

  const musicAttachTime =
    logStage(
      "BACKGROUND MUSIC",
      musicAttachStart
    );

  if (
    !fs.existsSync(
      finalMovie
    )
  ) {
    throw new Error(
      `Background music completed but output was not created: ${finalMovie}`
    );
  }

  // =====================================================
  // 11. FINAL VIDEO ENCODE
  // =====================================================

  console.log(
    "\n========== 11. FINAL VIDEO ENCODE =========="
  );

  const finalEncodeStart =
    now();

  /*
   * Combine:
   *
   * 1. Color grading
   * 2. Vignette
   * 3. Subtitle burning
   *
   * into ONE FFmpeg video encode.
   */

  await applyCinematicEffectsAndSubtitles({
    input:
      finalMovie,

    output:
      output,

    grade:
      director
        .scenePrompts[0]
        ?.colorGrade,

    subtitles:
      captionsPath,
  });

  const finalEncodeTime =
    logStage(
      "FINAL VIDEO ENCODE",
      finalEncodeStart
    );

  if (
    !fs.existsSync(output)
  ) {
    throw new Error(
      `Final video encode completed but output was not created: ${output}`
    );
  }

  // =====================================================
  // 12. VERIFY FINAL OUTPUT
  // =====================================================

  console.log(
    "\n========== 12. FINAL OUTPUT =========="
  );

  const verifyStart =
    now();

  if (
    !fs.existsSync(output)
  ) {
    throw new Error(
      "Renderer finished but output video does not exist."
    );
  }

  const finalStats =
    fs.statSync(output);

  console.log(
    "Final output:",
    output
  );

  console.log(
    "Final size:",
    `${(
      finalStats.size /
      1024 /
      1024
    ).toFixed(
      2
    )} MB`
  );

  console.log(
    "Final exists:",
    fs.existsSync(output)
  );

  const verifyTime =
    logStage(
      "FINAL OUTPUT VERIFICATION",
      verifyStart
    );

  const totalTime =
    secondsSince(
      totalStart
    );

  console.log(
    "\n\n=============================================="
  );

  console.log(
    "🎯 RENDER PERFORMANCE REPORT"
  );

  console.log(
    "=============================================="
  );

  console.log(
    `Director Plan:           ${directorTime.toFixed(
      2
    )}s`
  );

  console.log(
    `Music + Beat Detection:  ${musicTime.toFixed(
      2
    )}s`
  );

  console.log(
    `Beat Sync:               ${beatTime.toFixed(
      2
    )}s`
  );

  console.log(
    `Timeline Build:          ${timelineTime.toFixed(
      2
    )}s`
  );

  console.log(
    `Scene Rendering:         ${scenesTime.toFixed(
      2
    )}s`
  );

  console.log(
    `Scene FFprobe:           ${probeTime.toFixed(
      2
    )}s`
  );

  console.log(
    `XFade:                   ${xfadeTime.toFixed(
      2
    )}s`
  );

  console.log(
    `Movie FFprobe:           ${movieProbeTime.toFixed(
      2
    )}s`
  );

  console.log(
    `Narration:               ${narrationTime.toFixed(
      2
    )}s`
  );

  console.log(
    `Background Music:        ${musicAttachTime.toFixed(
      2
    )}s`
  );

  console.log(
    `Final Video Encode:      ${finalEncodeTime.toFixed(
      2
    )}s`
  );

  console.log(
    `Verification:            ${verifyTime.toFixed(
      2
    )}s`
  );

  console.log(
    "----------------------------------------------"
  );

  console.log(
    `TOTAL RENDER TIME:       ${totalTime.toFixed(
      2
    )}s`
  );

  console.log(
    `TOTAL RENDER TIME:       ${(
      totalTime /
      60
    ).toFixed(
      2
    )} minutes`
  );

  console.log(
    "==============================================\n"
  );

  return {
    director,

    finalDurations:
      timeline.finalDurations,

    totalDuration:
      timeline.totalDuration,
  };
}