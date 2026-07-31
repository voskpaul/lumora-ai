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
};

export function buildTimeline({
  audioDuration,
  sceneDurations,
  transitionDuration,
}: TimelineInput): TimelineResult {

  const transitionCount = Math.max(
    sceneDurations.length - 1,
    0
  );

  const desiredTotal = audioDuration;

  const currentTotal =
    sceneDurations.reduce(
      (a, b) => a + b,
      0
    ) -
    transitionDuration * transitionCount;

  const correction =
    desiredTotal - currentTotal;

  const corrected = [...sceneDurations];

  corrected[corrected.length - 1] += correction;

  if (corrected[corrected.length - 1] < 0.5) {
    corrected[corrected.length - 1] = 0.5;
  }

  const scenes: TimelineScene[] = [];

  let cursor = 0;

  corrected.forEach((duration, index) => {

    scenes.push({

      index,

      duration,

      start: cursor,

      end: cursor + duration,

    });

    cursor += duration;

    if (index !== corrected.length - 1) {
      cursor -= transitionDuration;
    }

  });

  return {

    totalDuration: cursor,

    transitionDuration,

    scenes,

  };

}