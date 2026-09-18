import { spawn } from "child_process";
import path from "path";

export async function detectBeats(
  music: string
): Promise<number[]> {
  return new Promise((resolve, reject) => {
    const script = path.join(
      process.cwd(),
      "python",
      "beat_detector.py"
    );

    const python = path.join(
      process.cwd(),
      "venv",
      "Scripts",
      "python.exe"
    );

    const child = spawn(
      python,
      [script, music],
      {
        windowsHide: true,
      }
    );

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    child.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    child.on("close", (code) => {
      if (code !== 0) {
        console.error(stderr);
        reject(
          new Error("Beat detector failed.")
        );
        return;
      }

      try {
        const result = JSON.parse(stdout);

        console.log("========== TEMPO ==========");
        console.log(result.tempo);

        console.log("========== BEATS ==========");
        console.log(result.beats);
        console.log("===========================");

        resolve(result.beats);
      } catch (err) {
        reject(err);
      }
    });
  });
}