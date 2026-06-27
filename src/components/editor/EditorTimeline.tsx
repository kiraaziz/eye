import { Button } from '@/components/ui/button'
import { TimelineClipBlock } from './TimelineClipBlock'
import type { ClipTracks, ZoomSegment } from '@/lib/editor/types'
import {
  Film,
  Mic,
  Pause,
  Play,
  Plus,
  SkipBack,
  SkipForward,
  Volume2,
  Wand2,
  ZoomIn,
} from 'lucide-react'
import { useCallback, useRef } from 'react'

function formatTime(ms: number): string {
  const s = ms / 1000
  const mins = Math.floor(s / 60)
  const secs = s % 60
  return `${mins}:${secs.toFixed(2).padStart(5, '0')}`
}

function formatRulerLabel(ms: number): string {
  const s = ms / 1000
  return s % 1 === 0 ? `${s}s` : `${s.toFixed(1)}s`
}

type EditorTimelineProps = {
  totalMs: number
  currentMs: number
  clips: ClipTracks
  zoomSegments: ZoomSegment[]
  onClipsChange: (clips: ClipTracks) => void
  onZoomSegmentsChange: (segments: ZoomSegment[]) => void
  onSeek: (ms: number) => void
  onAddZoom: () => void
  onAutoZoomFromClicks: () => void
  isPlaying: boolean
  onTogglePlay: () => void
}

export function EditorTimeline({
  totalMs,
  currentMs,
  clips,
  zoomSegments,
  onClipsChange,
  onZoomSegmentsChange,
  onSeek,
  onAddZoom,
  onAutoZoomFromClicks,
  isPlaying,
  onTogglePlay,
}: EditorTimelineProps) {
  const rulerRef = useRef<HTMLDivElement>(null)
  const zoomTrackRef = useRef<HTMLDivElement>(null)

  const rulerTicks = Array.from({ length: Math.ceil(totalMs / 3000) + 1 }, (_, i) => i * 3000)

  const seekFromEvent = useCallback(
    (e: React.MouseEvent | React.PointerEvent) => {
      if (!rulerRef.current) return
      const rect = rulerRef.current.getBoundingClientRect()
      const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left))
      onSeek((x / rect.width) * totalMs)
    },
    [onSeek, totalMs]
  )

  const playheadPct = totalMs > 0 ? (currentMs / totalMs) * 100 : 0

  const updateClip = (
    key: keyof ClipTracks,
    startMs: number,
    durationMs: number
  ) => {
    onClipsChange({ ...clips, [key]: { startMs, durationMs } })
  }

  const updateZoom = (id: string, startMs: number, durationMs: number) => {
    onZoomSegmentsChange(
      zoomSegments.map((z) =>
        z.id === id ? { ...z, startMs, endMs: startMs + durationMs } : z
      )
    )
  }

  return (
    <div className="flex flex-col border-t border-border bg-background">
      <div className="flex items-center gap-3 border-b border-border/50 px-4 py-2">
        <div className="flex items-center gap-1">
          <Button size="icon-sm" variant="ghost" onClick={() => onSeek(Math.max(0, currentMs - 1000))}>
            <SkipBack className="size-4" />
          </Button>
          <Button size="icon-sm" variant="outline" onClick={onTogglePlay}>
            {isPlaying ? <Pause className="size-4" /> : <Play className="size-4" />}
          </Button>
          <Button size="icon-sm" variant="ghost" onClick={() => onSeek(Math.min(totalMs, currentMs + 1000))}>
            <SkipForward className="size-4" />
          </Button>
        </div>
        <span className="font-mono text-xs text-muted-foreground">
          {formatTime(currentMs)} / {formatTime(totalMs)}
        </span>
        <div className="ml-auto flex gap-2">
          <Button size="sm" variant="outline" onClick={onAddZoom}>
            <Plus className="size-3.5" />
            Add zoom
          </Button>
          <Button size="sm" variant="secondary" onClick={onAutoZoomFromClicks}>
            <Wand2 className="size-3.5" />
            Auto from clicks
          </Button>
        </div>
      </div>

      <div className="relative overflow-x-auto px-4 pb-4 pt-2">
        <div
          ref={rulerRef}
          className="relative mb-1 ml-28 h-6 cursor-pointer select-none"
          onClick={seekFromEvent}
        >
          {rulerTicks.map((t) => (
            <div
              key={t}
              className="absolute top-0 flex flex-col items-center"
              style={{ left: `${(t / totalMs) * 100}%` }}
            >
              <div className="h-2 w-px bg-border" />
              <span className="mt-0.5 text-[10px] text-muted-foreground">
                {formatRulerLabel(t)}
              </span>
            </div>
          ))}

          <div
            className="pointer-events-none absolute top-0 bottom-0 z-20 w-0.5 bg-sky-400"
            style={{ left: `${playheadPct}%` }}
          >
            <div className="absolute -left-1.5 -top-1 size-3 rounded-full bg-sky-400 shadow" />
          </div>
        </div>

        <div className="relative space-y-1">
          <div
            className="pointer-events-none absolute top-0 bottom-0 z-10 w-0.5 bg-sky-400/60"
            style={{ left: `calc(7rem + ${playheadPct}% * (100% - 7rem) / 100)` }}
          />

          <TrackRow label="Video" icon={<Film className="size-3.5" />}>
            <TimelineClipBlock
              label="Clip"
              subtitle={`${(clips.screen.durationMs / 1000).toFixed(0)}s · 1x`}
              startMs={clips.screen.startMs}
              durationMs={clips.screen.durationMs}
              totalMs={totalMs}
              color="#e07b39"
              onChange={(s, d) => updateClip('screen', s, d)}
            />
          </TrackRow>

          <TrackRow label="Mic" icon={<Mic className="size-3.5" />}>
            <TimelineClipBlock
              label="Mic"
              startMs={clips.mic.startMs}
              durationMs={clips.mic.durationMs}
              totalMs={totalMs}
              color="#3b82f6"
              onChange={(s, d) => updateClip('mic', s, d)}
            />
          </TrackRow>

          <TrackRow label="Speaker" icon={<Volume2 className="size-3.5" />}>
            <TimelineClipBlock
              label="Speaker"
              startMs={clips.speaker.startMs}
              durationMs={clips.speaker.durationMs}
              totalMs={totalMs}
              color="#6366f1"
              onChange={(s, d) => updateClip('speaker', s, d)}
            />
          </TrackRow>

          <TrackRow
            label="Zoom"
            icon={<ZoomIn className="size-3.5 text-violet-400" />}
            action={
              <Button size="icon-xs" variant="ghost" onClick={onAddZoom}>
                <Plus className="size-3" />
              </Button>
            }
          >
            <div
              ref={zoomTrackRef}
              className="relative h-10 flex-1 rounded-md bg-muted/30"
            >
              {zoomSegments.map((seg) => (
                <ZoomSegmentBlock
                  key={seg.id}
                  segment={seg}
                  totalMs={totalMs}
                  trackRef={zoomTrackRef}
                  onChange={(startMs, durationMs) =>
                    updateZoom(seg.id, startMs, durationMs)
                  }
                  onDelete={() =>
                    onZoomSegmentsChange(zoomSegments.filter((z) => z.id !== seg.id))
                  }
                />
              ))}
            </div>
          </TrackRow>
        </div>
      </div>
    </div>
  )
}

function TrackRow({
  label,
  icon,
  children,
  action,
}: {
  label: string
  icon: React.ReactNode
  children: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex w-24 shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
        {action}
      </div>
      {children}
    </div>
  )
}

function ZoomSegmentBlock({
  segment,
  totalMs,
  trackRef,
  onChange,
  onDelete,
}: {
  segment: ZoomSegment
  totalMs: number
  trackRef: React.RefObject<HTMLDivElement | null>
  onChange: (startMs: number, durationMs: number) => void
  onDelete: () => void
}) {
  const durationMs = segment.endMs - segment.startMs
  const leftPct = (segment.startMs / totalMs) * 100
  const widthPct = (durationMs / totalMs) * 100

  return (
    <>
      <TimelineClipBlock
        label="Zoom"
        subtitle={`${segment.level}x · ${segment.mode === 'auto' ? 'Auto' : 'Manual'}`}
        startMs={segment.startMs}
        durationMs={durationMs}
        totalMs={totalMs}
        color="#8b5cf6"
        icon={<ZoomIn className="size-3" />}
        onChange={onChange}
        minDurationMs={300}
        sharedTrackRef={trackRef}
      />
      <button
        type="button"
        className="absolute top-1 z-20 rounded bg-black/40 px-1.5 text-[10px] text-white hover:bg-black/60"
        style={{
          left: `calc(${leftPct}% + ${widthPct}% - 18px)`,
        }}
        onClick={(e) => {
          e.stopPropagation()
          onDelete()
        }}
      >
        ×
      </button>
    </>
  )
}
