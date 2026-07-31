import { SubtitleScene } from "./subtitle-parser";

export type SemanticScene = {
  start: number;
  end: number;
  duration: number;
  text: string;
};

const ENDINGS = [".", "!", "?"];

export function buildSemanticScenes(
  subtitles: SubtitleScene[],
  targetSceneCount: number
): SemanticScene[] {
  const semantic: SemanticScene[] = [];

  let current: SubtitleScene[] = [];

  for (const subtitle of subtitles) {
    current.push(subtitle);

    if (
      ENDINGS.some(symbol =>
        subtitle.text.trim().endsWith(symbol)
      )
    ) {
      semantic.push({
        start: current[0].start,
        end: current[current.length - 1].end,
        duration:
          current[current.length - 1].end -
          current[0].start,
        text: current.map(s => s.text).join(" "),
      });

      current = [];
    }
  }

  if (current.length) {
    semantic.push({
      start: current[0].start,
      end: current[current.length - 1].end,
      duration:
        current[current.length - 1].end -
        current[0].start,
      text: current.map(s => s.text).join(" "),
    });
  }

  // Already matches image count
  if (semantic.length <= targetSceneCount) {
    return semantic;
  }

  // Merge neighboring scenes until counts match
  while (semantic.length > targetSceneCount) {
    let shortest = Number.MAX_VALUE;
    let index = 0;

    for (let i = 0; i < semantic.length - 1; i++) {
      const combined =
        semantic[i].duration +
        semantic[i + 1].duration;

      if (combined < shortest) {
        shortest = combined;
        index = i;
      }
    }

    semantic[index] = {
      start: semantic[index].start,
      end: semantic[index + 1].end,
      duration:
        semantic[index + 1].end -
        semantic[index].start,
      text:
        semantic[index].text +
        " " +
        semantic[index + 1].text,
    };

    semantic.splice(index + 1, 1);
  }

  return semantic;
}