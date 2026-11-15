import { NextResponse } from "next/server";
import ffmpegStatic from "ffmpeg-static";
import ffprobeStatic from "ffprobe-static";
import { authorizeDevelopmentDiagnostic } from "@/lib/diagnostics";

export async function GET() {
  const accessResponse = await authorizeDevelopmentDiagnostic();

  if (accessResponse) {
    return accessResponse;
  }

  return NextResponse.json({
    ffmpegAvailable: Boolean(ffmpegStatic),
    ffprobeAvailable: Boolean(ffprobeStatic),
  });
}
