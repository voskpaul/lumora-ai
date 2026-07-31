import { NextResponse } from "next/server";

import { auth } from "@/auth";

import { prisma } from "@/lib/prisma";

import path from "path";

import fs from "fs";

import axios from "axios";

import ffmpeg from "@/lib/ffmpeg";

import { renderCinematic } from "@/lib/renderer/render-cinematic";
export async function POST(req: Request) {

  console.log("🚀 RENDER STARTED - Only copying existing assets");





  try {

    const session = await auth();

    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });





    const { videoId } = await req.json();

    if (!videoId) return NextResponse.json({ error: "videoId required" }, { status: 400 });





    const user = await prisma.user.findUnique({ where: { email: session.user.email } });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });





    const video = await prisma.video.findFirst({

      where: { id: videoId, userId: user.id },

      include: { GeneratedImage: true },

    });

    console.log("================================");

console.log("VIDEO ID:", video?.id);

console.log("VIDEO URL:", video?.videoUrl);

console.log("CAPTION URL:", video?.captionsUrl);

console.log("================================");





    if (!video?.GeneratedImage?.length) return NextResponse.json({ error: "No images found" }, { status: 404 });

    if (!video.voiceUrl) return NextResponse.json({ error: "No voice generated" }, { status: 400 });





    const outputDir = path.join(process.cwd(), "public", "renders");

    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });





    const outputPath = path.join(outputDir, `${video.id}.mp4`);

    const tempDir = path.join(process.cwd(), "tmp", video.id);

    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });





  // ================== CAPTIONS ==================





const captionsAssPath = path.join(tempDir, "captions.ass");

if (!video.captionsUrl) {
  return NextResponse.json(
    {
      error: "Video has no captions.",
      videoId: video.id,
    },
    { status: 400 }
  );
}





const sourceAss = path.join(

  process.cwd(),

  "public",

  video.captionsUrl.replace(".srt", ".ass").replace(/^\/+/, "")

);



// ================== CAPTIONS ==================



console.log("ASS:", sourceAss);



if (!fs.existsSync(sourceAss)) {

  throw new Error(`ASS missing: ${sourceAss}`);

}



console.log("Copying ASS to:", captionsAssPath);



fs.copyFileSync(sourceAss, captionsAssPath);



console.log("ASS copied successfully.");

// ================== IMAGES ==================



const imagesDir = path.join(tempDir, "images");



if (!fs.existsSync(imagesDir)) {

  fs.mkdirSync(imagesDir, { recursive: true });

}



for (let i = 0; i < video.GeneratedImage.length; i++) {

  const img = video.GeneratedImage[i];



  const sourceImage = path.join(

    process.cwd(),

    "public",

    img.imageUrl.replace(/^\/+/, "")

  );



  console.log("Copying:", sourceImage);



  if (!fs.existsSync(sourceImage)) {

    throw new Error(`Image missing: ${sourceImage}`);

  }



  const ext = path.extname(sourceImage);



  const destination = path.join(

    imagesDir,

    `image-${i}${ext}`

  );



  fs.copyFileSync(sourceImage, destination);



  console.log("Copied to:", destination);

}



// ================== VOICE ==================



const voicePath = path.join(tempDir, "voice.mp3");



const voiceSource = path.join(

  process.cwd(),

  "public",

  video.voiceUrl.replace(/^\/+/, "")

);



console.log("Voice:", voiceSource);



if (!fs.existsSync(voiceSource)) {

  throw new Error(`Voice missing: ${voiceSource}`);

}



fs.copyFileSync(voiceSource, voicePath);



console.log("Voice copied successfully.");



// ================== START RENDER ==================


await renderCinematic({

  videoId: video.id,

  imagesDir,

  voicePath,

  captionsPath: captionsAssPath,

  outputPath,

});

console.log("Output directory:", outputDir);
console.log("Output exists:", fs.existsSync(outputDir));
console.log("Output file:", outputPath);



console.log("Render finished.");



if (!fs.existsSync(outputPath)) {

  throw new Error("Renderer finished but output video does not exist.");

}



await prisma.video.update({
  where: {
    id: video.id,
  },
  data: {
    videoUrl: `/renders/${video.id}.mp4`,
    captionsUrl: `/captions/${video.id}.ass`,
    status: "completed",
  },
});



return NextResponse.json({

  success: true,

  videoUrl: `/renders/${video.id}.mp4`,

});



  } catch (error: any) {

    console.error("Render error:", error);

    return NextResponse.json({ error: error.message || "Render failed" }, { status: 500 });

  }

}