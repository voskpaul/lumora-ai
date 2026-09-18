export function alignScenesToBeats(
  sceneDurations: number[],
  beats: number[]
): number[] {

  if (beats.length === 0) {
    return sceneDurations;
  }

  const aligned: number[] = [];

  let currentBeat = 0;

  for (const duration of sceneDurations) {

    const target =
      (aligned.reduce((a, b) => a + b, 0)) + duration;

    while (
      currentBeat < beats.length &&
      beats[currentBeat] < target
    ) {
      currentBeat++;
    }

    if (currentBeat < beats.length) {

      const previous =
        aligned.reduce((a, b) => a + b, 0);

      aligned.push(
        beats[currentBeat] - previous
      );

    } else {

      aligned.push(duration);

    }

  }

  return aligned;

}