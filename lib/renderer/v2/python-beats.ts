import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import crypto from "crypto";

type BeatCache = {
  tempo: number;
  duration: number;
  beats: number[];
};

function getMusicHash(music: string): string {
  const stat = fs.statSync(music);

  const key = [
    music,
    stat.size,
    stat.mtimeMs,
  ].join("|");

  return crypto
    .createHash("md5")
    .update(key)
    .digest("hex");
}

function getCachePath(music: string): string {
  const hash = getMusicHash(music);

  const cacheDir = path.join(
    process.cwd(),
    "tmp",
    "beat-cache"
  );

  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, {
      recursive: true,
    });
  }

  return path.join(
    cacheDir,
    `${hash}.json`
  );
}

export async function detectBeats(
  music: string
): Promise<number[]> {

  const cachePath = getCachePath(music);

  // ==========================================
  // BEAT CACHE
  // ==========================================

  if (fs.existsSync(cachePath)) {
    try {
      const cached =
        JSON.parse(
          fs.readFileSync(
            cachePath,
            "utf8"
          )
        ) as BeatCache;

      console.log("🎵 BEAT CACHE HIT");
      console.log("Music:", music);
      console.log(
        "Cached beats:",
        cached.beats.length
      );
      console.log(
        "Tempo:",
        cached.tempo
      );

      return cached.beats;

    } catch (error) {
      console.warn(
        "⚠️ Beat cache is invalid. Rebuilding..."
      );
    }
  }

  // ==========================================
  // CACHE MISS
  // ==========================================

  console.log("🎵 BEAT CACHE MISS");
  console.log(
    "Running Python beat detection..."
  );

  return new Promise(
    (resolve, reject) => {

      const start =
        performance.now();

      const python =
        process.platform === "win32"
          ? path.join(
              process.cwd(),
              "venv",
              "Scripts",
              "python.exe"
            )
          : "python3";

      const script =
        path.join(
          process.cwd(),
          "python",
          "beat_detector.py"
        );

      const child =
        spawn(
          python,
          [
            script,
            music,
          ],
          {
            windowsHide: true,
          }
        );

      let stdout = "";
      let stderr = "";

      child.stdout.on(
        "data",
        (data) => {
          stdout +=
            data.toString();
        }
      );

      child.stderr.on(
        "data",
        (data) => {
          stderr +=
            data.toString();
        }
      );

      child.on(
        "close",
        (code) => {

          const elapsed =
            performance.now() -
            start;

          console.log(
            `🎵 Python beat detection: ${(elapsed / 1000).toFixed(2)}s`
          );

          if (code !== 0) {

            console.error(
              "Python stderr:",
              stderr
            );

            reject(
              new Error(
                stderr ||
                `Beat detector exited with code ${code}`
              )
            );

            return;
          }

          try {

            const result =
              JSON.parse(stdout) as BeatCache;

            // ==================================
            // SAVE CACHE
            // ==================================

            fs.writeFileSync(
              cachePath,
              JSON.stringify(
                result,
                null,
                2
              ),
              "utf8"
            );

            console.log(
              "💾 Beat detection cached"
            );

            console.log(
              "Beats:",
              result.beats.length
            );

            console.log(
              "Tempo:",
              result.tempo
            );

            resolve(
              result.beats || []
            );

          } catch (error) {

            console.error(
              "Beat detector output:",
              stdout
            );

            reject(error);
          }
        }
      );

      child.on(
        "error",
        reject
      );
    }
  );
}