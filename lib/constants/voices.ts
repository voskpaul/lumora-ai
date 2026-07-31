export const VOICES = {
  female: "en-US-JennyNeural",
  male: "en-US-GuyNeural",
  narrator: "en-US-AriaNeural",
  news: "en-US-DavisNeural",
} as const;

export type VoiceType = keyof typeof VOICES;

export const DEFAULT_VOICE: VoiceType = "female";