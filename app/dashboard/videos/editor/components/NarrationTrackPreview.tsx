
"use client";

import { useEffect, useRef } from "react";

export interface NarrationPreviewTrack {
  id: string;
  audioUrl: string;
  startTime: number;
  duration: number;
  trimStart: number;
  trimEnd: number;
  volume: number;
  muted: boolean;
}

interface NarrationTrackPreviewProps {
  tracks: NarrationPreviewTrack[];
  currentTime: number;
  isPlaying: boolean;
}

const clampVolume = (value: number) =>
  Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));

export default function NarrationTrackPreview({
  tracks,
  currentTime,
  isPlaying,
}: NarrationTrackPreviewProps) {
  const audioRefs = useRef(new Map<string, HTMLAudioElement>());

  useEffect(() => {
    const activeIds = new Set(tracks.map((track) => track.id));

    for (const [id, audio] of audioRefs.current) {
      if (!activeIds.has(id)) {
        audio.pause();
        audio.removeAttribute("src");
        audio.load();
        audioRefs.current.delete(id);
      }
    }

    for (const track of tracks) {
      if (!track.audioUrl) continue;

      let audio = audioRefs.current.get(track.id);

      if (!audio) {
        audio = new Audio();
        audio.preload = "auto";
        audioRefs.current.set(track.id, audio);
      }

      const rawUrl = track.audioUrl.trim();
      const expectedUrl = /^https?:\/\//i.test(rawUrl)
        ? rawUrl
        : `/${rawUrl.replace(/^\/+/, "")}`;

      const absoluteUrl = new URL(expectedUrl, window.location.href).href;

      if (audio.src !== absoluteUrl) {
        audio.pause();
        audio.src = absoluteUrl;
        audio.load();
      }

      audio.volume = clampVolume(track.volume);
      audio.muted = track.muted || track.volume <= 0;
    }
  }, [tracks]);

  useEffect(() => {
    const syncPlayback = () => {
      for (const track of tracks) {
        const audio = audioRefs.current.get(track.id);
        if (!audio) continue;

        audio.volume = clampVolume(track.volume);
        audio.muted = track.muted || track.volume <= 0;

        const start = Math.max(0, track.startTime);
        const trimStart = Math.max(0, track.trimStart);
        const trimEnd = Math.max(0, track.trimEnd);
        const playableDuration = Math.max(
          0,
          track.duration - trimStart - trimEnd
        );
        const end = start + playableDuration;

        const shouldPlay =
          isPlaying &&
          !track.muted &&
          track.volume > 0 &&
          currentTime >= start &&
          currentTime < end;

        if (!shouldPlay) {
          if (!audio.paused) audio.pause();
          continue;
        }

        const expectedTime = trimStart + currentTime - start;

        if (audio.readyState >= HTMLMediaElement.HAVE_METADATA) {
          if (Math.abs(audio.currentTime - expectedTime) > 0.25) {
            try {
              audio.currentTime = expectedTime;
            } catch {
              // Retry on the next synchronization.
            }
          }
        }

        if (audio.paused) {
          void audio.play().catch((error: unknown) => {
            console.warn(
              `Narration preview failed for scene ${track.id}:`,
              error
            );
          });
        }
      }
    };

    syncPlayback();
    const intervalId = window.setInterval(syncPlayback, 100);

    return () => window.clearInterval(intervalId);
  }, [tracks, currentTime, isPlaying]);

  useEffect(() => {
    return () => {
      for (const audio of audioRefs.current.values()) {
        audio.pause();
        audio.removeAttribute("src");
        audio.load();
      }
      audioRefs.current.clear();
    };
  }, []);

  return null;
}
