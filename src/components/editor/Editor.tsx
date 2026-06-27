import { Button } from '@/components/ui/button'
import type { RecordingResult } from '@/lib/types/recording'
import {
  createDefaultClips,
  DEFAULT_ZOOM_SETTINGS,
  FPS,
  type ClipTracks,
  type ZoomSegment,
  type ZoomSettings,
} from '@/lib/editor/types'
import {
  createManualZoom,
  generateZoomsFromClicks,
} from '@/lib/editor/zoom'
import { normalizeRecordingResult } from '@/lib/editor/assets'
import { EditorPreview, type PlayerRef } from './EditorPreview'
import { EditorTimeline } from './EditorTimeline'
import { ZoomSettingsPanel } from './ZoomSettingsPanel'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowLeft, ClipboardPaste, Download } from 'lucide-react'

type EditorProps = {
  data: RecordingResult | null
  setData: React.Dispatch<React.SetStateAction<RecordingResult | null>>
}

export function Editor({ data, setData }: EditorProps) {
  const [clips, setClips] = useState<ClipTracks | null>(null)
  const [zoomSegments, setZoomSegments] = useState<ZoomSegment[]>([])
  const [zoomSettings, setZoomSettings] = useState<ZoomSettings>(DEFAULT_ZOOM_SETTINGS)
  const [currentMs, setCurrentMs] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [pasteOpen, setPasteOpen] = useState(!data)
  const [pasteText, setPasteText] = useState('')
  const [pasteError, setPasteError] = useState<string | null>(null)

  const previewClips = useMemo(() => clips, [clips])
  const previewZoomSegments = useMemo(() => zoomSegments, [zoomSegments])
  const previewZoomSettings = useMemo(() => zoomSettings, [zoomSettings])

  const playerRef = useRef<PlayerRef>(null)
  const rafRef = useRef<number | null>(null)

  const recording = useMemo(
    () => (data ? normalizeRecordingResult(data) : null),
    [data]
  )

  const durationMs = recording?.meta.durationMs ?? 0

  useEffect(() => {
    if (recording && !clips) {
      setClips(createDefaultClips(recording.meta.durationMs))
    }
  }, [recording, clips])

  const syncPlayhead = useCallback(() => {
    const player = playerRef.current
    if (!player) return
    const frame = player.getCurrentFrame()
    setCurrentMs((frame / FPS) * 1000)
    if (player.isPlaying()) {
      rafRef.current = requestAnimationFrame(syncPlayhead)
    }
  }, [])

  useEffect(() => {
    if (isPlaying) {
      rafRef.current = requestAnimationFrame(syncPlayhead)
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [isPlaying, syncPlayhead])

  const handleSeek = useCallback((ms: number) => {
    const frame = Math.round((ms / 1000) * FPS)
    playerRef.current?.seekTo(frame)
    setCurrentMs(ms)
  }, [])

  const handleTogglePlay = useCallback(() => {
    const player = playerRef.current
    if (!player) return
    if (player.isPlaying()) {
      player.pause()
      setIsPlaying(false)
    } else {
      player.play()
      setIsPlaying(true)
    }
  }, [])

  const handlePasteManifest = () => {
    try {
      const parsed = normalizeRecordingResult(
        JSON.parse(pasteText) as RecordingResult
      )
      if (!parsed.meta?.durationMs || !parsed.assets) {
        throw new Error('Invalid manifest: missing meta or assets')
      }
      setData(parsed)
      setClips(createDefaultClips(parsed.meta.durationMs))
      setZoomSegments([])
      setCurrentMs(0)
      setPasteOpen(false)
      setPasteError(null)
    } catch (err) {
      setPasteError(err instanceof Error ? err.message : 'Invalid JSON')
    }
  }

  const handleAddZoom = () => {
    const start = currentMs
    const end = Math.min(durationMs, start + 1200)
    setZoomSegments((prev) => [
      ...prev,
      createManualZoom(start, end, zoomSettings),
    ])
  }

  const handleAutoZoomFromClicks = () => {
    if (!recording) return
    const generated = generateZoomsFromClicks(
      recording.mouseEvents,
      recording.meta.durationMs,
      zoomSettings
    )
    setZoomSegments(generated)
  }

  if (!recording || !clips) {
    return (
      <div className="flex h-screen flex-col bg-background text-foreground">
        <header className="flex items-center gap-3 border-b border-border px-4 py-3">
          <Link to="/">
            <Button size="icon-sm" variant="ghost">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <h1 className="text-sm font-medium">Editor</h1>
        </header>

        <div className="flex flex-1 items-center justify-center p-8">
          <div className="w-full max-w-2xl space-y-4 rounded-xl border border-border bg-card p-6">
            <div className="flex items-center gap-2">
              <ClipboardPaste className="size-5 text-muted-foreground" />
              <h2 className="text-lg font-medium">Paste manifest JSON</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Paste your recording manifest from green-eye to load the timeline and preview.
            </p>
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder='{ "config": ..., "assets": ..., "meta": ..., "mouseEvents": [...] }'
              className="h-64 w-full resize-none rounded-lg border border-border bg-muted/30 p-3 font-mono text-xs outline-none focus:ring-2 focus:ring-ring"
            />
            {pasteError && (
              <p className="text-sm text-destructive">{pasteError}</p>
            )}
            <Button onClick={handlePasteManifest} disabled={!pasteText.trim()}>
              Load manifest
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
      <header className="flex shrink-0 items-center justify-between border-b border-border px-4 py-2">
        <div className="flex items-center gap-3">
          <Link to="/">
            <Button size="icon-sm" variant="ghost">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <img src="./logo.svg" className="h-6" alt="" />
          <span className="text-sm font-medium">Kira Eye Editor</span>
          <span className="text-xs text-muted-foreground">
            {(durationMs / 1000).toFixed(1)}s
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setPasteOpen(true)
              setPasteText(JSON.stringify(data, null, 2))
            }}
          >
            <ClipboardPaste className="size-3.5" />
            Manifest
          </Button>
          <Button size="sm" variant="default">
            <Download className="size-3.5" />
            Export
          </Button>
        </div>
      </header>

      {pasteOpen && (
        <div className="border-b border-border bg-muted/20 p-4">
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            className="mb-2 h-32 w-full resize-none rounded-lg border border-border bg-background p-2 font-mono text-xs"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handlePasteManifest}>
              Reload
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setPasteOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        <div className="flex min-w-0 flex-1 flex-col">
          <EditorPreview
            data={recording}
            clips={previewClips}
            zoomSegments={previewZoomSegments}
            zoomSettings={previewZoomSettings}
            isPlaying={isPlaying}
            playerRef={playerRef}
          />
        </div>
        <ZoomSettingsPanel settings={zoomSettings} onChange={setZoomSettings} />
      </div>

      <EditorTimeline
        totalMs={durationMs}
        currentMs={currentMs}
        clips={clips}
        zoomSegments={zoomSegments}
        onClipsChange={setClips}
        onZoomSegmentsChange={setZoomSegments}
        onSeek={handleSeek}
        onAddZoom={handleAddZoom}
        onAutoZoomFromClicks={handleAutoZoomFromClicks}
        isPlaying={isPlaying}
        onTogglePlay={handleTogglePlay}
      />
    </div>
  )
}
