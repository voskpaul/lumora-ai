import fs from "fs";

export type SubtitleScene = {
  start: number;
  end: number;
  duration: number;
  text: string;
};

function assTimeToSeconds(time: string): number {
  const [h, m, s] = time.split(":");

  return (
    Number(h) * 3600 +
    Number(m) * 60 +
    Number(s.replace(",", "."))
  );
}

export function parseASS(
  assPath: string
): SubtitleScene[] {
  if (!fs.existsSync(assPath)) {
    throw new Error(`ASS file not found: ${assPath}`);
  }

  const ass = fs.readFileSync(assPath, "utf8");

  const scenes: SubtitleScene[] = [];

  const lines = ass.split(/\r?\n/);

  for (const line of lines) {
    if (!line.startsWith("Dialogue:")) continue;

    const parts = line.split(",");

    if (parts.length < 10) continue;

    const start = assTimeToSeconds(parts[1]);
    const end = assTimeToSeconds(parts[2]);

    const text = parts
      .slice(9)
      .join(",")
      .replace(/\{.*?\}/g, "")
      .trim();

    scenes.push({
      start,
      end,
      duration: end - start,
      text,
    });
  }

  return scenes;
}