import fs from "fs";
import { styleSubtitle } from "./subtitle-director";

export function prepareASS(
  sourcePath: string,
  tempPath: string
) {
  if (!fs.existsSync(sourcePath)) {
    throw new Error("ASS file missing: " + sourcePath);
  }

  fs.copyFileSync(sourcePath, tempPath);

  let content = fs.readFileSync(tempPath, "utf8");

  const lines = content.split("\n");

  const styledLines = lines.map((line) => {
    if (!line.startsWith("Dialogue:")) {
      return line;
    }

    const parts = line.split(",");

    if (parts.length < 10) {
      return line;
    }

    const text = parts.slice(9).join(",");

    const style = styleSubtitle(text);

    const override =
      `{\\fs${style.fontSize}` +
      `\\bord${style.outline}` +
      `\\c&H${style.color}&` +
      `${style.animation}}`;

      console.log("Subtitle Style", {
  text,
  style,
});

    parts[9] = override + text;

    return parts.join(",");
  });

  content = styledLines.join("\n");

  fs.writeFileSync(tempPath, content);

  return {
    path: tempPath,
    content,
  };
}