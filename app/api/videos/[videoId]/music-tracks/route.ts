import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ videoId: string }>;
};

const getOwnedVideo = async (videoId: string, userId: string) => {
  return prisma.video.findFirst({
    where: {
      id: videoId,
      userId,
    },
    select: { id: true },
  });
};

const normalizeMusicUrl = (value: string): string | null => {
  const url = value.trim();

  if (/^https?:\/\//i.test(url)) {
    try {
      const parsed = new URL(url);
      return parsed.protocol === "https:" || parsed.protocol === "http:"
        ? url
        : null;
    } catch {
      return null;
    }
  }

  const path = `/${url.replace(/^\/+/, "")}`;

  // Local audio may come from the public music library or generated narration.
  if (
    /^\/(?:music|voices)\/[a-z0-9_./() -]+\.mp3$/i.test(path)
  ) {
    if (path.split("/").some((part) => part === "." || part === "..")) {
      return null;
    }
    return path;
  }
  return null;
};

export async function GET(
  _request: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { videoId } = await params;
    const video = await getOwnedVideo(videoId, session.user.id);

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    const musicTracks = await prisma.musicTrack.findMany({
      where: { videoId },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ musicTracks });
  } catch (error) {
    console.error("Failed to fetch music tracks:", error);
    return NextResponse.json(
      { error: "Failed to fetch music tracks" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { videoId } = await params;
    const video = await getOwnedVideo(videoId, session.user.id);

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    const body = await request.json();

    const audioUrl =
  typeof body.audioUrl === "string"
    ? normalizeMusicUrl(body.audioUrl) ?? ""
    : "";
    const duration = Number(body.duration);

    if (
      !audioUrl ||
      !Number.isFinite(duration) ||
      duration <= 0
    ) {
      return NextResponse.json(
        { error: "A valid audioUrl and positive duration are required" },
        { status: 400 }
      );
    }

    const startTime = Number(body.startTime ?? 0);
    const trimStart = Number(body.trimStart ?? 0);
    const trimEnd = Number(body.trimEnd ?? 0);
    const volume = Number(body.volume ?? 1);

    if (
      !Number.isFinite(startTime) ||
      startTime < 0 ||
      !Number.isFinite(trimStart) ||
      trimStart < 0 ||
      !Number.isFinite(trimEnd) ||
      trimEnd < 0 ||
      !Number.isFinite(volume) ||
      volume < 0 ||
      volume > 1 ||
      trimStart >= duration ||
      trimStart + trimEnd >= duration
    ) {
      return NextResponse.json(
        { error: "Invalid music track timing or volume values" },
        { status: 400 }
      );
    }

    const musicTrack = await prisma.musicTrack.create({
      data: {
        videoId,
        name: typeof body.name === "string" ? body.name.trim() : null,
        audioUrl,
        duration,
        startTime,
        trimStart,
        trimEnd,
        volume,
        muted: body.muted === true,
      },
    });

    return NextResponse.json({ musicTrack }, { status: 201 });
  } catch (error) {
    console.error("Failed to create music track:", error);
    return NextResponse.json(
      { error: "Failed to create music track" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { videoId } = await params;
    const video = await getOwnedVideo(videoId, session.user.id);

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    const body = await request.json();
    const trackId =
      typeof body.id === "string" ? body.id : "";

    if (!trackId) {
      return NextResponse.json(
        { error: "Music track id is required" },
        { status: 400 }
      );
    }

    const existing = await prisma.musicTrack.findFirst({
      where: { id: trackId, videoId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Music track not found" },
        { status: 404 }
      );
    }

    const data: {
      name?: string | null;
      audioUrl?: string;
      duration?: number;
      startTime?: number;
      trimStart?: number;
      trimEnd?: number;
      volume?: number;
      muted?: boolean;
    } = {};

    if (body.name !== undefined) {
      if (body.name !== null && typeof body.name !== "string") {
        return NextResponse.json({ error: "Invalid name" }, { status: 400 });
      }
      data.name = typeof body.name === "string" ? body.name.trim() : null;
    }

    if (body.audioUrl !== undefined) {
      if (typeof body.audioUrl !== "string" || !body.audioUrl.trim()) {
        return NextResponse.json({ error: "Invalid audioUrl" }, { status: 400 });
      }
      const normalizedUrl = normalizeMusicUrl(body.audioUrl);

if (!normalizedUrl) {
  return NextResponse.json(
    { error: "Use a valid HTTP(S) URL or a path under /music/ ending in .mp3" },
    { status: 400 }
  );
}

data.audioUrl = normalizedUrl;
    }

    for (const field of [
      "duration",
      "startTime",
      "trimStart",
      "trimEnd",
      "volume",
    ] as const) {
      if (body[field] !== undefined) {
        const value = Number(body[field]);

        if (!Number.isFinite(value)) {
          return NextResponse.json(
            { error: `Invalid ${field}` },
            { status: 400 }
          );
        }

        data[field] = value;
      }
    }

    if (body.muted !== undefined) {
      if (typeof body.muted !== "boolean") {
        return NextResponse.json({ error: "Invalid muted value" }, { status: 400 });
      }
      data.muted = body.muted;
    }

    const duration = data.duration ?? existing.duration;
    const startTime = data.startTime ?? existing.startTime;
    const trimStart = data.trimStart ?? existing.trimStart;
    const trimEnd = data.trimEnd ?? existing.trimEnd;
    const volume = data.volume ?? existing.volume;

    if (
      duration <= 0 ||
      startTime < 0 ||
      trimStart < 0 ||
      trimStart >= duration ||
      trimEnd < 0 ||
      trimStart + trimEnd >= duration||
      volume < 0 ||
      volume > 1
    ) {
      return NextResponse.json(
        { error: "Invalid music track timing or volume values" },
        { status: 400 }
      );
    }

    const musicTrack = await prisma.musicTrack.update({
      where: { id: trackId },
      data,
    });

    return NextResponse.json({ musicTrack });
  } catch (error) {
    console.error("Failed to update music track:", error);
    return NextResponse.json(
      { error: "Failed to update music track" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { videoId } = await params;
    const video = await getOwnedVideo(videoId, session.user.id);

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const trackId = typeof body.id === "string" ? body.id : "";

    if (!trackId) {
      return NextResponse.json(
        { error: "Music track id is required" },
        { status: 400 }
      );
    }

    const result = await prisma.musicTrack.deleteMany({
      where: { id: trackId, videoId },
    });

    if (result.count === 0) {
      return NextResponse.json(
        { error: "Music track not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, id: trackId });
  } catch (error) {
    console.error("Failed to delete music track:", error);
    return NextResponse.json(
      { error: "Failed to delete music track" },
      { status: 500 }
    );
  }
}