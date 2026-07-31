import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

import path from "path";
import fs from "fs";
import axios from "axios";

import { runRenderPipeline } from "@/lib/renderer/render-pipeline";
import { parseASS } from "@/lib/renderer/subtitle-parser";
import { buildSemanticScenes } from "@/lib/renderer/semantic-scenes";
import sharp from "sharp"

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { videoId } = await req.json();

    if (!videoId) {
      return NextResponse.json(
        { error: "videoId required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const video = await prisma.video.findFirst({
      where: {
        id: videoId,
        userId: user.id,
      },
    });

    if (!video?.script) {
      return NextResponse.json(
        { error: "Video not found" },
        { status: 404 }
      );
    }

    console.log("🎨 IMAGE GENERATION STARTED");

    await prisma.generatedImage.deleteMany({
      where: {
        videoId: video.id,
      },
    });

    //-------------------------------------------------------
    // Semantic prompts if captions exist
    // Otherwise fall back to script prompts
    //-------------------------------------------------------

    let renderPipeline:
  | ReturnType<typeof runRenderPipeline>
  | null = null;

    

    const captionsPath = path.join(
      process.cwd(),
      "tmp",
      video.id,
      "captions.ass"
    );

    if (fs.existsSync(captionsPath)) {

      console.log("✅ captions.ass found");
      console.log("Using semantic scene prompts");

      const subtitles = parseASS(captionsPath);

      const semanticScenes = buildSemanticScenes(
        subtitles,
        8
      );

      renderPipeline = runRenderPipeline(semanticScenes);

console.log("\n========== HOLLYWOOD DIRECTOR ==========");
console.table(
  renderPipeline.scenes.map((scene) => ({
    scene: scene.id,
    duration: `${scene.duration}s`,
    shot: scene.camera.shot,
    movement: scene.camera.movement,
  }))
);

      

    } else {

  console.log("⚠ captions.ass not found");
  console.log("🎬 Building semantic scenes from script");

  const scriptSentences = video.script
  .split(".")
  .map((s: string) => s.trim())
  .filter((s: string) => s.length > 0)
  .slice(0, 8);

const semanticScenes = scriptSentences.map(
  (sentence: string, index: number) => ({
    text: sentence,
    start: index * 3,
    end: index * 3 + 3,
    duration: 3,
  })
);

  renderPipeline = runRenderPipeline(
    semanticScenes
  );

  console.log("\n========== HOLLYWOOD DIRECTOR ==========");
  console.table(
    renderPipeline.scenes.map((scene) => ({
      scene: scene.id,
      duration: `${scene.duration}s`,
      shot: scene.camera.shot,
      movement: scene.camera.movement,
    }))
  );

}

    const imageDir = path.join(
      process.cwd(),
      "public",
      "images",
      video.id
    );

    if (!fs.existsSync(imageDir)) {
      fs.mkdirSync(imageDir, {
        recursive: true,
      });
    }

    if (!renderPipeline) {
  throw new Error("Hollywood Render Pipeline was not created.");
}

    const generatedImages = [];

   for (const scene of renderPipeline.scenes) {

  console.log(`\n🎬 Rendering Scene ${scene.id + 1}`);

  const imagePrompt = scene.prompt;

  console.log("\n========== FINAL HOLLYWOOD PROMPT ==========\n");
  console.log(imagePrompt);

  const imageUrl =
  `https://image.pollinations.ai/prompt/${encodeURIComponent(imagePrompt)}?model=flux&width=1080&height=1920`;

  console.log(imageUrl);
  console.log("=========================");
      const response = await axios.get(
        imageUrl,
        {
          responseType: "arraybuffer",
        }
      );

      const filename = `image-${scene.id}.jpg`;

      const filepath = path.join(
        imageDir,
        filename
      );

      fs.writeFileSync(
        filepath,
        response.data
      );

      const meta = await sharp(filepath).metadata();

console.log(
  `Scene ${scene.id + 1}: ${meta.width} x ${meta.height}`
);

      const image = await prisma.generatedImage.create({
        data: {
          prompt: imagePrompt,
          imageUrl: `/images/${video.id}/${filename}`,
          userId: user.id,
          videoId: video.id,
        },
      });

      generatedImages.push(image);

      console.log(
  `✅ Scene ${scene.id + 1}/${renderPipeline.totalScenes}`
);
    }

    return NextResponse.json({
      success: true,
      imageCount: generatedImages.length,
      images: generatedImages,
    });

  } catch (error: any) {

    console.error("========== IMAGE ERROR ==========");
    console.error(error);
    console.error(error?.message);
    console.error(error?.stack);
    console.error("================================");

    return NextResponse.json(
      {
        error: error?.message || "Failed to generate images",
      },
      {
        status: 500,
      }
    );
  }
}