export function snapTimelineToBeats(
  sceneDurations: number[],
  beats: number[]
) {
  const snapped: number[] = [];

  let cursor = 0;

  for (const duration of sceneDurations) {

    const target = cursor + duration;

    let closest = target;

    let bestDistance = Number.MAX_VALUE;

    for (const beat of beats) {

      const d = Math.abs(
        beat - target
      );

      if (d < bestDistance) {

        bestDistance = d;

        closest = beat;

      }

    }

    const snappedDuration =
      Math.max(
        0.5,
        closest - cursor
      );

    snapped.push(snappedDuration);

    cursor += snappedDuration;

  }

  return snapped;
}