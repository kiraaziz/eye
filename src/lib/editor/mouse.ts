import type { DisplayInfo, MouseEventEntry } from '@/lib/types/recording'

export type DisplayPoint = { x: number; y: number }

const POSITION_TYPES = new Set(['move', 'click', 'mousedown', 'mouseup'])

export function toDisplayCoords(
  x: number,
  y: number,
  display: DisplayInfo
): DisplayPoint {
  return {
    x: x - display.bounds.x,
    y: y - display.bounds.y,
  }
}

export function getPositionEvents(events: MouseEventEntry[]): MouseEventEntry[] {
  return events.filter((e) => POSITION_TYPES.has(e.type))
}

export function getMouseAtTime(
  events: MouseEventEntry[],
  tMs: number,
  display: DisplayInfo
): DisplayPoint {
  const positions = getPositionEvents(events)
  if (positions.length === 0) {
    return { x: display.bounds.width / 2, y: display.bounds.height / 2 }
  }

  if (tMs <= positions[0].t) {
    return toDisplayCoords(positions[0].x, positions[0].y, display)
  }

  const last = positions[positions.length - 1]
  if (tMs >= last.t) {
    return toDisplayCoords(last.x, last.y, display)
  }

  let lo = 0
  let hi = positions.length - 1
  while (lo < hi - 1) {
    const mid = Math.floor((lo + hi) / 2)
    if (positions[mid].t <= tMs) lo = mid
    else hi = mid
  }

  const a = positions[lo]
  const b = positions[hi]
  const span = b.t - a.t
  const ratio = span === 0 ? 0 : (tMs - a.t) / span

  const x = a.x + (b.x - a.x) * ratio
  const y = a.y + (b.y - a.y) * ratio
  return toDisplayCoords(x, y, display)
}

/** Exponential smoothing for glide camera movement */
export function smoothPoint(
  prev: DisplayPoint | null,
  next: DisplayPoint,
  alpha: number
): DisplayPoint {
  if (!prev) return next
  return {
    x: prev.x + (next.x - prev.x) * alpha,
    y: prev.y + (next.y - prev.y) * alpha,
  }
}
