export const QUALITY_PRESETS = {
  low:    { width: 1280, height: 720,  frameRate: 24, videoBitsPerSecond: 2_500_000,  audioBitsPerSecond: 96_000 },
  medium: { width: 1920, height: 1080, frameRate: 30, videoBitsPerSecond: 6_000_000,  audioBitsPerSecond: 128_000 },
  high:   { width: 1920, height: 1080, frameRate: 60, videoBitsPerSecond: 12_000_000, audioBitsPerSecond: 160_000 },
  ultra:  { width: 2560, height: 1440, frameRate: 60, videoBitsPerSecond: 20_000_000, audioBitsPerSecond: 192_000 },
} as const

export type QualityPreset = keyof typeof QUALITY_PRESETS
export type StreamQuality = (typeof QUALITY_PRESETS)[QualityPreset]