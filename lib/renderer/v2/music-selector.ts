import fs from "fs";
import path from "path";
import { ColorGrade } from "./color-grade";

export function chooseMusic(
  grade: ColorGrade
): string {

  const musicDir = path.join(
    process.cwd(),
    "public",
    "music",
    grade
  );

  const files = fs
    .readdirSync(musicDir)
    .filter(f => f.endsWith(".mp3"));

  if (files.length === 0) {
    throw new Error(
      `No music found for ${grade}`
    );
  }

  const selected =
    files[
      Math.floor(Math.random() * files.length)
    ];

  return path.join(
    musicDir,
    selected
  );
}