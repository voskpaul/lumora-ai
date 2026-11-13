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
  <div className="flex h-full min-h-0 flex-col overflow-hidden">
    <div className="min-h-0 flex-1 overflow-hidden">
      <Timeline
        videoId={videoId}
        currentTime={currentTime}
        onSeek={handleSeek}
        isPlaying={isPlaying}
        onTogglePlay={handleTogglePlay}
        onRestart={handleRestart}
        preview={
          <VideoPreview
            videoUrl={videoUrl}
            currentTime={currentTime}
            onTimeUpdate={handleTimeUpdate}
            onPlayingChange={handlePlayingChange}
            seekRequest={seekRequestRef.current}
          />
        }
      />
    </div>
  </div>
);
}