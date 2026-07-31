// app/api/test-ffmpeg/route.ts

import { NextResponse } from "next/server";
import ffmpegStatic from "ffmpeg-static";
import ffprobeStatic from "ffprobe-static";

export async function GET() {
  return NextResponse.json({
    ffmpegStatic,
    ffprobeStatic,
    cwd: process.cwd(),
  });
}