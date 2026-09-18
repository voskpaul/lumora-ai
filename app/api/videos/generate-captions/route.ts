import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import path from "path";
import fs from "fs";
import { spawn } from "child_process";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { videoId } = await req.json();
    if (!videoId) {
      return NextResponse.json({ error: "videoId required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const video = await prisma.video.findFirst({
      where: { id: videoId, userId: user.id },
    });

    if (!video?.voiceUrl) {
      return NextResponse.json({ error: "Generate voice first" }, { status: 400 });
    }

    console.log("🎙️ Generating captions using local Faster-Whisper...");

    let srtContent = "";

    let voiceFilePath: string;

    if (video.voiceUrl.startsWith("http")) {
      const tempVoice = path.join(
        process.cwd(),
        "tmp",
        `${video.id}-voice.mp3`
      );

      const voiceRes = await fetch(video.voiceUrl);

      if (!voiceRes.ok) {
        throw new Error("Failed to fetch voice");
      }

      const buffer = Buffer.from(await voiceRes.arrayBuffer());

      fs.writeFileSync(tempVoice, buffer);

      voiceFilePath = tempVoice;
    } else {
      voiceFilePath = path.join(
        process.cwd(),
        "public",
        video.voiceUrl.replace(/^\/+/, "")
      );
    }

    if (!fs.existsSync(voiceFilePath)) {
      return NextResponse.json(
        { error: "Voice file not found" },
        { status: 404 }
      );
    }

    const pythonExe = path.join(
  process.cwd(),
  "venv",
  "Scripts",
  "python.exe"
);

const scriptPath = path.join(
  process.cwd(),
  "python",
  "transcribe.py"
);

const tmpDir = path.join(process.cwd(), "tmp");

if (!fs.existsSync(tmpDir)) {
  fs.mkdirSync(tmpDir, { recursive: true });
}

if (!fs.existsSync(pythonExe)) {
  throw new Error(`Python not found: ${pythonExe}`);
}

if (!fs.existsSync(scriptPath)) {
  throw new Error(`transcribe.py not found: ${scriptPath}`);
}

const outputSrt = path.join(
  tmpDir,
  `${video.id}.srt`
);

const outputAss = path.join(
  tmpDir,
  `${video.id}.ass`
);

    await new Promise<void>((resolve, reject) => {
  const proc = spawn(pythonExe, [
    scriptPath,
    voiceFilePath,
    outputSrt,
  ]);

  proc.stdout.on("data", (data) => {
    console.log("[PYTHON]", data.toString());
  });

  proc.stderr.on("data", (data) => {
    console.error("[PYTHON ERR]", data.toString());
  });

  proc.on("error", (err) => {
    reject(err);
  });

  proc.on("close", (code) => {
    console.log("Python exited with:", code);

    console.log("========== TMP DIRECTORY ==========");
    console.log(fs.readdirSync(tmpDir));
    console.log("===================================");

    console.log("ASS path:", outputAss);
    console.log("ASS exists:", fs.existsSync(outputAss));

    if (fs.existsSync(outputAss)) {
      console.log("outputAss =", outputAss);
console.log("Exists now =", fs.existsSync(outputAss));
      console.log("ASS size:", fs.statSync(outputAss).size);
    }

    if (code === 0) {
      resolve();
    } else {
      reject(new Error("Python transcription failed"));
    }
  });
});

    srtContent = fs.readFileSync(outputSrt, "utf8");

    console.log("✅ Faster-Whisper captions generated");

    // Save captions
    const captionsDir = path.join(process.cwd(), "public", "captions");
    if (!fs.existsSync(captionsDir)) {
      fs.mkdirSync(captionsDir, { recursive: true });
    }

    const srtFilename = `${video.id}.srt`;
const assFilename = `${video.id}.ass`;

const srtPath = path.join(captionsDir, srtFilename);
const assPath = path.join(captionsDir, assFilename);

fs.writeFileSync(srtPath, srtContent);

// copy generated ASS
console.log("================================");
console.log("outputAss:", outputAss);
console.log("assPath:", assPath);
console.log("exists?", fs.existsSync(outputAss));
console.log("================================");

if (!fs.existsSync(outputAss)) {
  throw new Error(`ASS missing: ${outputAss}`);
}

fs.copyFileSync(outputAss, assPath);

console.log("ASS copied successfully.");

console.log("Public folder now:");
console.log(fs.readdirSync(captionsDir));

console.log(
  "Copied exists:",
  fs.existsSync(assPath)
);

const captionsUrl = `/captions/${assFilename}`;

    // Update database
    await prisma.video.update({
      where: { id: video.id },
      data: { captionsUrl },
    });
    const updated = await prisma.video.findUnique({
  where: { id: video.id },
});

console.log("DATABASE AFTER UPDATE");
console.log(updated?.captionsUrl);

    // Cleanup temporary files AFTER they have been copied
try {
  fs.unlinkSync(outputSrt);
} catch {}

try {
  fs.unlinkSync(outputAss);
} catch {}

    return NextResponse.json({
      success: true,
      videoId: video.id,
      captionsUrl,
      note: "Captions generated successfully",
    });

  } catch (error: any) {
    console.error("Generate captions error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate captions" },
      { status: 500 }
    );
  }
}