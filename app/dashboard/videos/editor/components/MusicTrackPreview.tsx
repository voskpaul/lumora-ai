
"use client";

import { useEffect, useRef } from "react";

export interface MusicPreviewTrack {
  id: string;
  audioUrl: string;
  startTime: number;
  duration: number;
  trimStart: number;
  trimEnd: number;
  volume: number;
  muted: boolean;
}

interface MusicTrackPreviewProps {
  tracks: MusicPreviewTrack[];
  currentTime: number;
  isPlaying: boolean;
}

const clampVolume = (value: number) =>
  Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));

export default function MusicTrackPreview({
  tracks,
  currentTime,
  isPlaying,
}: MusicTrackPreviewProps) {
  const audioRefs = useRef(new Map<string, HTMLAudioElement>());

  // Create audio players and apply track changes immediately.
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

      const rawAudioUrl = track.audioUrl.trim();

const expectedUrl = /^https?:\/\//i.test(rawAudioUrl)
        ? rawAudioUrl
        : `/${rawAudioUrl.replace(/^\/+/, "")}`;
      const absoluteUrl = new URL(expectedUrl, window.location.href).href;

      if (audio.src !== absoluteUrl) {
        audio.pause();
        audio.src = absoluteUrl;
        audio.load();
      }

      // Apply these even when playback is currently paused.
      audio.volume = clampVolume(track.volume);
      audio.muted = track.muted || track.volume <= 0;
    }
  }, [tracks]);

  // Synchronize audio to the timeline playhead.
  useEffect(() => {
    let disposed = false;

    const syncPlayback = () => {
      if (disposed) return;

      for (const track of tracks) {
        const audio = audioRefs.current.get(track.id);
        if (!audio) continue;

        audio.volume = clampVolume(track.volume);
        audio.muted = track.muted || track.volume <= 0;

        const start = Math.max(0, track.startTime || 0);
        const sourceStart = Math.max(0, track.trimStart || 0);
        const sourceEnd = Math.max(
          sourceStart,
          track.duration - Math.max(0, track.trimEnd || 0)
        );
        const clipEnd = start + sourceEnd - sourceStart;

        const shouldPlay =
          isPlaying &&
          !track.muted &&
          track.volume > 0 &&
          currentTime >= start &&
          currentTime < clipEnd;

        if (!shouldPlay) {
          if (!audio.paused) audio.pause();
          continue;
        }

        const expectedTime = sourceStart + currentTime - start;

        // Wait for metadata before seeking to the trim position.
        if (audio.readyState >= HTMLMediaElement.HAVE_METADATA) {
          if (Math.abs(audio.currentTime - expectedTime) > 0.25) {
            try {
              audio.currentTime = expectedTime;
            } catch {
              // The next sync will retry.
            }
          }
        }

        if (audio.paused) {
          void audio.play().catch((error: unknown) => {
            console.warn(
              `Music preview failed for track ${track.id}:`,
              error
            );
          });
        }
      }
    };

    syncPlayback();
    const intervalId = window.setInterval(syncPlayback, 100);

    return () => {
      disposed = true;
      window.clearInterval(intervalId);
    };
  }, [tracks, currentTime, isPlaying]);

  // Release audio resources when the component unmounts.
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
