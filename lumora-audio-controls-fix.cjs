const fs = require("fs");

const paths = {
  narration: "app/dashboard/videos/editor/components/NarrationTrackPreview.tsx",
  music: "app/dashboard/videos/editor/components/MusicTrackPreview.tsx",
  video: "app/dashboard/videos/editor/components/VideoPreview.tsx",
  timeline: "app/dashboard/videos/editor/components/Timeline.tsx",
};

const hookNarration = `
  // Start/pause the separate narration player directly from video playback events.
  useEffect(() => {
    const pauseAll = () => {
      for (const audio of audioRefs.current.values()) audio.pause();
    };
    const playAtCurrentTime = () => {
      for (const track of tracks) {
        const audio = audioRefs.current.get(track.id);
        if (!audio) continue;
        const start = Math.max(0, track.startTime);
        const trimStart = Math.max(0, track.trimStart);
        const trimEnd = Math.max(0, track.trimEnd);
        const playableDuration = Math.max(0, track.duration - trimStart - trimEnd);
        const end = start + playableDuration;
        audio.volume = clampVolume(track.volume);
        audio.muted = track.muted || track.volume <= 0;
        const active = !track.muted && track.volume > 0 && currentTime >= start && currentTime < end;
        if (!active) {
          if (!audio.paused) audio.pause();
          continue;
        }
        const expectedTime = trimStart + currentTime - start;
        if (audio.readyState >= HTMLMediaElement.HAVE_METADATA && Math.abs(audio.currentTime - expectedTime) > 0.25) {
          try { audio.currentTime = expectedTime; } catch {}
        }
        if (audio.paused) void audio.play().catch((error: unknown) => console.warn("Narration preview could not start:", error));
      }
    };
    window.addEventListener("lumora-editor-audio-play", playAtCurrentTime);
    window.addEventListener("lumora-editor-audio-pause", pauseAll);
    return () => {
      window.removeEventListener("lumora-editor-audio-play", playAtCurrentTime);
      window.removeEventListener("lumora-editor-audio-pause", pauseAll);
    };
  }, [tracks, currentTime]);
`;

const hookMusic = `
  // Start/pause the separate music player directly from video playback events.
  useEffect(() => {
    const pauseAll = () => {
      for (const audio of audioRefs.current.values()) audio.pause();
    };
    const playAtCurrentTime = () => {
      for (const track of tracks) {
        const audio = audioRefs.current.get(track.id);
        if (!audio) continue;
        const start = Math.max(0, track.startTime || 0);
        const sourceStart = Math.max(0, track.trimStart || 0);
        const sourceEnd = Math.max(sourceStart, track.duration - Math.max(0, track.trimEnd || 0));
        const end = start + sourceEnd - sourceStart;
        audio.volume = clampVolume(track.volume);
        audio.muted = track.muted || track.volume <= 0;
        const active = !track.muted && track.volume > 0 && currentTime >= start && currentTime < end;
        if (!active) {
          if (!audio.paused) audio.pause();
          continue;
        }
        const expectedTime = sourceStart + currentTime - start;
        if (audio.readyState >= HTMLMediaElement.HAVE_METADATA && Math.abs(audio.currentTime - expectedTime) > 0.25) {
          try { audio.currentTime = expectedTime; } catch {}
        }
        if (audio.paused) void audio.play().catch((error: unknown) => console.warn("Music preview could not start:", error));
      }
    };
    window.addEventListener("lumora-editor-audio-play", playAtCurrentTime);
    window.addEventListener("lumora-editor-audio-pause", pauseAll);
    return () => {
      window.removeEventListener("lumora-editor-audio-play", playAtCurrentTime);
      window.removeEventListener("lumora-editor-audio-pause", pauseAll);
    };
  }, [tracks, currentTime]);
`;

function insertBeforeReturn(text, hook, label) {
  const marker = "  return null;";
  if (text.includes("lumora-editor-audio-play")) throw new Error(label + " already has audio event wiring; no files changed.");
  if (text.split(marker).length !== 2) throw new Error(label + ": expected one return-null marker; no files changed.");
  return text.replace(marker, hook + "\n" + marker);
}

const contents = {};
for (const key of Object.keys(paths)) contents[key] = fs.readFileSync(paths[key], "utf8");

contents.narration = insertBeforeReturn(contents.narration, hookNarration, "NarrationTrackPreview");
contents.music = insertBeforeReturn(contents.music, hookMusic, "MusicTrackPreview");

const videoPlayOld = `          onPlay={() => {
            onPlayingChange?.(true);`;
const videoPlayNew = `          onPlay={() => {
            window.dispatchEvent(new Event("lumora-editor-audio-play"));
            onPlayingChange?.(true);`;
const videoPauseOld = `          onPause={() => {
            onPlayingChange?.(false);`;
const videoPauseNew = `          onPause={() => {
            window.dispatchEvent(new Event("lumora-editor-audio-pause"));
            onPlayingChange?.(false);`;
const muteOld = `          muted
          playsInline`;
const muteNew = `          muted
          onVolumeChange={(event) => {
            if (!event.currentTarget.muted) event.currentTarget.muted = true;
          }}
          playsInline`;

for (const [oldText, newText, label] of [
  [videoPlayOld, videoPlayNew, "VideoPreview onPlay handler"],
  [videoPauseOld, videoPauseNew, "VideoPreview onPause handler"],
  [muteOld, muteNew, "VideoPreview muted element"],
]) {
  if (contents.video.split(oldText).length !== 2) throw new Error(label + ": expected exactly one match; no files changed.");
  contents.video = contents.video.replace(oldText, newText);
}

const voiceClamp = /const safeVolume\s*=\s*Math\.min\(\s*MAX_VOICE_VOLUME,\s*Math\.max\(\s*MIN_VOICE_VOLUME,\s*Number\.isFinite\(volume\)\s*\?\s*volume\s*:\s*1\s*\)\s*\);/;
const matches = contents.timeline.match(new RegExp(voiceClamp.source, "g")) || [];
if (matches.length !== 1) throw new Error("Expected one voice-volume clamp but found " + matches.length + "; no files changed.");
contents.timeline = contents.timeline.replace(
  voiceClamp,
  "const safeVolume = Math.min(MAX_VOICE_VOLUME, Math.max(0, Number.isFinite(volume) ? volume : 1));"
);

// All source checks passed before any file is changed.
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
for (const key of Object.keys(paths)) {
  fs.copyFileSync(paths[key], paths[key] + ".bak-audio-controls-" + stamp);
}
for (const key of Object.keys(paths)) {
  fs.writeFileSync(paths[key], contents[key], "utf8");
  console.log("Patched " + paths[key]);
}
console.log("Backups created with .bak-audio-controls-" + stamp + " suffix.");
