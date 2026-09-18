"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import VideoPreview from "./VideoPreview";
import Timeline from "./Timeline";

interface EditorClientProps {
  videoId: string;
  videoUrl?: string | null;
}

export default function EditorClient({
  videoId,
  videoUrl,
}: EditorClientProps) {
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const seekRequestRef = useRef<number | null>(null);

  // =====================================================
  // TIME UPDATE
  // =====================================================

  const handleTimeUpdate = useCallback(
    (time: number) => {
      setCurrentTime(time);
    },
    []
  );

  // =====================================================
  // PLAYBACK STATE
  // =====================================================

  const handlePlayingChange = useCallback(
    (playing: boolean) => {
      setIsPlaying(playing);
    },
    []
  );

  // =====================================================
  // SEEK
  // =====================================================

  const handleSeek = useCallback((time: number) => {
    const safeTime = Math.max(
      0,
      Number.isFinite(time) ? time : 0
    );

    seekRequestRef.current = safeTime;

    setCurrentTime(safeTime);
  }, []);

  // =====================================================
  // PLAY / PAUSE
  // =====================================================

  const handleTogglePlay = useCallback(() => {
    window.dispatchEvent(
      new CustomEvent("lumora-editor-toggle-play")
    );
  }, []);

  // =====================================================
  // RESTART
  // =====================================================

  const handleRestart = useCallback(() => {
    window.dispatchEvent(
      new CustomEvent("lumora-editor-restart")
    );

    setCurrentTime(0);
  }, []);

  // =====================================================
  // RESET PLAYHEAD WHEN VIDEO URL CHANGES
  // =====================================================

  useEffect(() => {
    setCurrentTime(0);
    setIsPlaying(false);
  }, [videoUrl]);

  // =====================================================
  // EDITOR PLAYBACK KEYBOARD SHORTCUTS
  // =====================================================

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;

      if (
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT" ||
        target?.isContentEditable
      ) {
        return;
      }

      if (event.code === "Space") {
        event.preventDefault();

        window.dispatchEvent(
          new CustomEvent(
            "lumora-editor-toggle-play"
          )
        );
      }

      if (event.code === "Home") {
        event.preventDefault();

        window.dispatchEvent(
          new CustomEvent(
            "lumora-editor-restart"
          )
        );

        setCurrentTime(0);
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, []);

  return (
    <div className="space-y-4">
      {/* =================================================
          PLAYBACK BAR
      ================================================= */}

      <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/30 px-4 py-3">
        <div className="flex items-center gap-2">
          {/* RESTART */}

          <button
            type="button"
            onClick={handleRestart}
            disabled={!videoUrl}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
            title="Restart"
          >
            ↻
          </button>

          {/* PLAY / PAUSE */}

          <button
            type="button"
            onClick={handleTogglePlay}
            disabled={!videoUrl}
            className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-black transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-30"
          >
            {isPlaying ? "⏸ Pause" : "▶ Play"}
          </button>

          <span className="ml-2 text-xs text-white/40">
            Space = Play/Pause · Home = Restart
          </span>
        </div>

        <div className="font-mono text-xs text-white/50">
          {currentTime.toFixed(2)}s
        </div>
      </div>

      {/* =================================================
          VIDEO PREVIEW
      ================================================= */}

      <VideoPreview
        videoUrl={videoUrl}
        currentTime={currentTime}
        onTimeUpdate={handleTimeUpdate}
        onPlayingChange={handlePlayingChange}
        seekRequest={seekRequestRef.current}
      />

      {/* =================================================
          TIMELINE
      ================================================= */}

      <Timeline
        videoId={videoId}
        currentTime={currentTime}
        onSeek={handleSeek}
        isPlaying={isPlaying}
      />
    </div>
  );
}