import type { DisplayInfo, MouseEventEntry } from '@/lib/types/recording'
import { getMouseAtTime, smoothPoint, type DisplayPoint } from './mouse'
import type { ZoomSegment, ZoomSettings } from './types'

export type CameraState = {
  scale: number
  focalX: number
  focalY: number
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
}

function clampFocal(
  point: DisplayPoint,
  display: DisplayInfo,
  scale: number,
  snapToEdges: number
): DisplayPoint {
  const { width, height } = display.bounds
  const snap = snapToEdges / 100
  const marginX = (width / scale) * snap * 0.5
  const marginY = (height / scale) * snap * 0.5

  return {
    x: Math.max(marginX, Math.min(width - marginX, point.x)),
    y: Math.max(marginY, Math.min(height - marginY, point.y)),
  }
}

function segmentScaleAtTime(
  segment: ZoomSegment,
  tMs: number
): number {
  const rampMs = 280
  const { startMs, endMs, level } = segment

  if (tMs < startMs || tMs > endMs) return 1

  if (tMs < startMs + rampMs) {
    const p = (tMs - startMs) / rampMs
    return 1 + (level - 1) * easeInOut(p)
  }

  if (tMs > endMs - rampMs) {
    const p = (endMs - tMs) / rampMs
    return 1 + (level - 1) * easeInOut(p)
  }

  return level
}

export function getActiveZoomSegment(
  segments: ZoomSegment[],
  tMs: number
): ZoomSegment | null {
  return segments.find((s) => tMs >= s.startMs && tMs <= s.endMs) ?? null
}

export function computeCameraAtTime(
  tMs: number,
  segments: ZoomSegment[],
  mouseEvents: MouseEventEntry[],
  display: DisplayInfo,
  settings: ZoomSettings,
  glideCache?: { prev: DisplayPoint | null; alpha: number }
): CameraState {
  const active = getActiveZoomSegment(segments, tMs)
  const center = {
    x: display.bounds.width / 2,
    y: display.bounds.height / 2,
  }

  if (!active) {
    return { scale: 1, focalX: center.x, focalY: center.y }
  }

  const scale = segmentScaleAtTime(active, tMs)
  const useAuto = active.mode === 'auto' || settings.mode === 'auto'

  let raw: DisplayPoint
  if (useAuto) {
    raw = getMouseAtTime(mouseEvents, tMs, display)
  } else if (active.centerX != null && active.centerY != null) {
    raw = toDisplayRelative(active.centerX, active.centerY, display)
  } else {
    raw = center
  }

  if (settings.glide && glideCache) {
    raw = smoothPoint(glideCache.prev, raw, glideCache.alpha)
    glideCache.prev = raw
  }

  const focal = clampFocal(raw, display, scale, settings.snapToEdges)
  return { scale, focalX: focal.x, focalY: focal.y }
}

function toDisplayRelative(
  absX: number,
  absY: number,
  display: DisplayInfo
): DisplayPoint {
  return {
    x: absX - display.bounds.x,
    y: absY - display.bounds.y,
  }
}

export function generateZoomsFromClicks(
  mouseEvents: MouseEventEntry[],
  durationMs: number,
  settings: ZoomSettings
): ZoomSegment[] {
  const clicks = mouseEvents.filter((e) => e.type === 'click')

  return clicks.map((click, i) => {
    const nextClick = clicks[i + 1]
    const naturalEnd = click.t + 1400
    const nextLimit = nextClick ? nextClick.t - 80 : durationMs
    const endMs = Math.min(naturalEnd, nextLimit, durationMs)
    const startMs = Math.max(0, click.t - 250)

    return {
      id: crypto.randomUUID(),
      startMs,
      endMs: Math.max(startMs + 400, endMs),
      mode: 'auto' as const,
      level: settings.level,
      centerX: click.x,
      centerY: click.y,
    }
  })
}

export function createManualZoom(
  startMs: number,
  endMs: number,
  settings: ZoomSettings,
  centerX?: number,
  centerY?: number
): ZoomSegment {
  return {
    id: crypto.randomUUID(),
    startMs,
    endMs,
    mode: settings.mode,
    level: settings.level,
    centerX,
    centerY,
  }
}
