export type TimelineClip = {
  startMs: number
  durationMs: number
}

export type ClipTracks = {
  screen: TimelineClip
  mic: TimelineClip
  speaker: TimelineClip
}

export type ZoomSegment = {
  id: string
  startMs: number
  endMs: number
  mode: 'auto' | 'manual'
  level: number
  centerX?: number
  centerY?: number
}

export type ZoomSettings = {
  mode: 'auto' | 'manual'
  level: number
  snapToEdges: number
  glide: boolean
}

export const DEFAULT_ZOOM_SETTINGS: ZoomSettings = {
  mode: 'auto',
  level: 1.5,
  snapToEdges: 50,
  glide: true,
}

export const FPS = 30

export function createDefaultClips(durationMs: number): ClipTracks {
  return {
    screen: { startMs: 0, durationMs },
    mic: { startMs: 0, durationMs },
    speaker: { startMs: 0, durationMs },
  }
}
