import { cn } from '@/lib/utils'
import { useCallback, useRef, useState, type RefObject } from 'react'

type DragMode = 'move' | 'resize-start' | 'resize-end' | null

type TimelineClipBlockProps = {
  label: string
  startMs: number
  durationMs: number
  totalMs: number
  color: string
  icon?: React.ReactNode
  subtitle?: string
  onChange: (startMs: number, durationMs: number) => void
  minDurationMs?: number
  /** When set, clip is layered on a shared track (e.g. multiple zoom segments) */
  sharedTrackRef?: RefObject<HTMLDivElement | null>
}

export function TimelineClipBlock({
  label,
  startMs,
  durationMs,
  totalMs,
  color,
  icon,
  subtitle,
  onChange,
  minDurationMs = 200,
  sharedTrackRef,
}: TimelineClipBlockProps) {
  const ownTrackRef = useRef<HTMLDivElement>(null)
  const trackRef = sharedTrackRef ?? ownTrackRef
  const [drag, setDrag] = useState<{
    mode: DragMode
    originX: number
    originStart: number
    originDuration: number
  } | null>(null)

  const leftPct = (startMs / totalMs) * 100
  const widthPct = (durationMs / totalMs) * 100

  const onPointerDown = useCallback(
    (e: React.PointerEvent, mode: DragMode) => {
      e.stopPropagation()
      e.preventDefault()
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
      setDrag({
        mode,
        originX: e.clientX,
        originStart: startMs,
        originDuration: durationMs,
      })
    },
    [startMs, durationMs]
  )

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!drag || !trackRef.current) return
      const rect = trackRef.current.getBoundingClientRect()
      const deltaPx = e.clientX - drag.originX
      const deltaMs = (deltaPx / rect.width) * totalMs

      if (drag.mode === 'move') {
        const nextStart = Math.max(
          0,
          Math.min(totalMs - drag.originDuration, drag.originStart + deltaMs)
        )
        onChange(nextStart, drag.originDuration)
      } else if (drag.mode === 'resize-start') {
        const nextStart = Math.max(
          0,
          Math.min(
            drag.originStart + drag.originDuration - minDurationMs,
            drag.originStart + deltaMs
          )
        )
        const nextDuration =
          drag.originStart + drag.originDuration - nextStart
        onChange(nextStart, nextDuration)
      } else if (drag.mode === 'resize-end') {
        const nextDuration = Math.max(
          minDurationMs,
          Math.min(totalMs - drag.originStart, drag.originDuration + deltaMs)
        )
        onChange(drag.originStart, nextDuration)
      }
    },
    [drag, totalMs, onChange, minDurationMs, trackRef]
  )

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    setDrag(null)
    try {
      ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
    } catch {
      /* already released */
    }
  }, [])

  const clipBar = (
    <div
      className={cn(
        'absolute top-0.5 bottom-0.5 flex cursor-grab items-center gap-1.5 overflow-hidden rounded-md px-2 text-xs font-medium text-white shadow-sm active:cursor-grabbing',
        drag?.mode === 'move' && 'ring-2 ring-white/40'
      )}
      style={{
        left: `${leftPct}%`,
        width: `${widthPct}%`,
        backgroundColor: color,
        minWidth: 48,
      }}
      onPointerDown={(e) => onPointerDown(e, 'move')}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <div
        className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize rounded-l-md bg-yellow-400/80 hover:bg-yellow-300"
        onPointerDown={(e) => onPointerDown(e, 'resize-start')}
      />
      <div className="flex min-w-0 flex-1 items-center gap-1.5 pl-2">
        {icon}
        <span className="truncate">{label}</span>
        {subtitle && (
          <span className="truncate opacity-70">{subtitle}</span>
        )}
      </div>
      <div
        className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize rounded-r-md bg-yellow-400/80 hover:bg-yellow-300"
        onPointerDown={(e) => onPointerDown(e, 'resize-end')}
      />
    </div>
  )

  if (sharedTrackRef) {
    return clipBar
  }

  return (
    <div
      ref={ownTrackRef}
      className="relative h-10 flex-1 rounded-md bg-muted/30"
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {clipBar}
    </div>
  )
}
