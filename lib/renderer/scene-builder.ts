import { SubtitleScene } from "./subtitle-parser";

export type VideoScene = {
  start: number;
  end: number;
  duration: number;
  text: string;
};

export function buildScenes(
  subtitles: SubtitleScene[],
  imageCount: number
): VideoScene[] {
  if (subtitles.length === 0) return [];

  const wordsPerScene = Math.ceil(
    subtitles.length / imageCount
  );

  const scenes: VideoScene[] = [];

  for (
    let i = 0;
    i < subtitles.length;
    i += wordsPerScene
  ) {
    const group = subtitles.slice(i, i + wordsPerScene);

    scenes.push({
      start: group[0].start,
      end: group[group.length - 1].end,
      duration:
        group[group.length - 1].end -
        group[0].start,
      text: group
        .map((g) => g.text)
        .join(" "),
    });
  }

  return scenes;
}