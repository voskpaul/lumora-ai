"use client";

import {
  useCallback,
  useEffect,
  useRef,
} from "react";

interface VideoPreviewProps {
  videoUrl?: string | null;
  currentTime?: number;
  onTimeUpdate?: (time: number) => void;
  onPlayingChange?: (playing: boolean) => void;
  seekRequest?: number | null;
}

export default function VideoPreview({
  videoUrl,
  currentTime = 0,
  onTimeUpdate,
  onPlayingChange,
  seekRequest,
}: VideoPreviewProps) {
  const videoRef =
    useRef<HTMLVideoElement>(null);

  const lastSeekRequestRef =
    useRef<number | null>(null);

  // =====================================================
  // SEEK FROM TIMELINE
  // =====================================================

  useEffect(() => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    if (
      seekRequest === null ||
      seekRequest === undefined
    ) {
      return;
    }

    if (
      lastSeekRequestRef.current ===
      seekRequest
    ) {
      return;
    }

    lastSeekRequestRef.current =
      seekRequest;

    const safeTime = Math.max(
      0,
      Number.isFinite(seekRequest)
        ? seekRequest
        : 0
    );

    if (
      Math.abs(
        video.currentTime - safeTime
      ) > 0.05
    ) {
      video.currentTime = safeTime;
    }
  }, [seekRequest]);

  // =====================================================
  // KEEP VIDEO SYNCHRONIZED
  // =====================================================

  useEffect(() => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    if (!Number.isFinite(currentTime)) {
      return;
    }

    /*
     * Do not constantly overwrite currentTime while
     * the video is playing. The video's own clock is
     * authoritative during playback.
     */
    if (!video.paused) {
      return;
    }

    if (
      Math.abs(
        video.currentTime - currentTime
      ) > 0.1
    ) {
      video.currentTime =
        Math.max(0, currentTime);
    }
  }, [currentTime]);

  // =====================================================
  // TOGGLE PLAY
  // =====================================================

  const togglePlay = useCallback(() => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    if (video.paused) {
      void video.play();
    } else {
      video.pause();
    }
  }, []);

  // =====================================================
  // RESTART
  // =====================================================

  const restart = useCallback(() => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    video.currentTime = 0;

    onTimeUpdate?.(0);

    /*
     * Restart playback immediately if the editor
     * was already playing.
     */
    void video.play();
  }, [onTimeUpdate]);

  // =====================================================
  // EDITOR EVENTS
  // =====================================================

  useEffect(() => {
    const handleTogglePlay =
      () => {
        togglePlay();
      };

    const handleRestart =
      () => {
        restart();
      };

    window.addEventListener(
      "lumora-editor-toggle-play",
      handleTogglePlay
    );

    window.addEventListener(
      "lumora-editor-restart",
      handleRestart
    );

    return () => {
      window.removeEventListener(
        "lumora-editor-toggle-play",
        handleTogglePlay
      );

      window.removeEventListener(
        "lumora-editor-restart",
        handleRestart
      );
    };
  }, [
    restart,
    togglePlay,
  ]);

  // =====================================================
  // RESET WHEN VIDEO URL CHANGES
  // =====================================================

  useEffect(() => {
  const video = videoRef.current;

  if (!video) return;

  video.pause();
  video.currentTime = 0;
  lastSeekRequestRef.current = null;

  onTimeUpdate?.(0);
  onPlayingChange?.(false);

// Reset only when the video source changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [videoUrl]);

  return (
    <div className="flex h-full min-h-0 w-full items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-black">
      {videoUrl ? (
        <video
          ref={videoRef}
          src={videoUrl}
          controls
          
          playsInline
          preload="metadata"
          muted
          className="block h-full w-full object-contain"
          onLoadedMetadata={(event) => {
            const video =
              event.currentTarget;

            console.log(
              "========== VIDEO READY =========="
            );

            console.log({
              duration:
                video.duration,
              currentTime:
                video.currentTime,
              src:
                video.currentSrc,
            });

            console.log(
              "================================="
            );
          }}
          onPlay={(event) => {
            event.currentTarget.muted = true;
            onPlayingChange?.(true);

            console.log(
              "EDITOR PLAYBACK: PLAY"
            );
          }}
          onPause={(event) => {
            onPlayingChange?.(false);

            console.log(
              "EDITOR PLAYBACK: PAUSE"
            );
          }}
          onTimeUpdate={(event) => {
            const video =
              event.currentTarget;

            const time =
              video.currentTime;

            onTimeUpdate?.(time);
          }}
          onSeeking={(event) => {
            const video =
              event.currentTarget;

            onTimeUpdate?.(
              video.currentTime
            );
          }}
          onEnded={(event) => {
            const video =
              event.currentTarget;

            console.log(
              "EDITOR PLAYBACK: ENDED"
            );

            video.currentTime = 0;

            onTimeUpdate?.(0);
            onPlayingChange?.(false);
          }}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-white/40">
          No rendered video yet
        </div>
      )}
    </div>
  );
}