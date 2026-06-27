// import {
//   createDefaultClips,
//   DEFAULT_ZOOM_SETTINGS,
//   FPS,
//   type ClipTracks,
//   type ZoomSegment,
//   type ZoomSettings,
// } from '@/lib/editor/types'
// import {
//   createManualZoom,
//   generateZoomsFromClicks,
// } from '@/lib/editor/zoom'
// import { normalizeRecordingResult } from '@/lib/editor/assets'
// import { EditorPreview, type PlayerRef } from './EditorPreview'
// import { EditorTimeline } from './EditorTimeline'
// import { ZoomSettingsPanel } from './ZoomSettingsPanel'
// import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { RecordingResult } from 'types/recording'

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { Timeline } from './TimeLine'

type EditorProps = {
  data: RecordingResult | null
}

export function Editor({ data }: EditorProps) {
  // const [clips, setClips] = useState<ClipTracks | null>(null)
  // const [zoomSegments, setZoomSegments] = useState<ZoomSegment[]>([])
  // const [zoomSettings, setZoomSettings] = useState<ZoomSettings>(DEFAULT_ZOOM_SETTINGS)
  // const [currentMs, setCurrentMs] = useState(0)
  // const [isPlaying, setIsPlaying] = useState(false)

  // const previewClips = useMemo(() => clips, [clips])
  // const previewZoomSegments = useMemo(() => zoomSegments, [zoomSegments])
  // const previewZoomSettings = useMemo(() => zoomSettings, [zoomSettings])

  // const playerRef = useRef<PlayerRef>(null)
  // const rafRef = useRef<number | null>(null)

  // const recording = useMemo(
  //   () => (data ? normalizeRecordingResult(data) : null),
  //   [data]
  // )

  // const durationMs = recording?.meta.durationMs ?? 0

  // useEffect(() => {
  //   if (recording && !clips) {
  //     setClips(createDefaultClips(recording.meta.durationMs))
  //   }
  // }, [recording, clips])

  // const syncPlayhead = useCallback(() => {
  //   const player = playerRef.current
  //   if (!player) return
  //   const frame = player.getCurrentFrame()
  //   setCurrentMs((frame / FPS) * 1000)
  //   if (player.isPlaying()) {
  //     rafRef.current = requestAnimationFrame(syncPlayhead)
  //   }
  // }, [])

  // useEffect(() => {
  //   if (isPlaying) {
  //     rafRef.current = requestAnimationFrame(syncPlayhead)
  //   }
  //   return () => {
  //     if (rafRef.current) cancelAnimationFrame(rafRef.current)
  //   }
  // }, [isPlaying, syncPlayhead])

  // const handleSeek = useCallback((ms: number) => {
  //   const frame = Math.round((ms / 1000) * FPS)
  //   playerRef.current?.seekTo(frame)
  //   setCurrentMs(ms)
  // }, [])

  // const handleTogglePlay = useCallback(() => {
  //   const player = playerRef.current
  //   if (!player) return
  //   if (player.isPlaying()) {
  //     player.pause()
  //     setIsPlaying(false)
  //   } else {
  //     player.play()
  //     setIsPlaying(true)
  //   }
  // }, [])

  // const handleAddZoom = () => {
  //   const start = currentMs
  //   const end = Math.min(durationMs, start + 1200)
  //   setZoomSegments((prev) => [
  //     ...prev,
  //     createManualZoom(start, end, zoomSettings),
  //   ])
  // }

  // const handleAutoZoomFromClicks = () => {
  //   if (!recording) return
  //   const generated = generateZoomsFromClicks(
  //     recording.mouseEvents,
  //     recording.meta.durationMs,
  //     zoomSettings
  //   )
  //   setZoomSegments(generated)
  // }

  // if (!recording || !clips) {
  //   return (
  //     <div className="flex h-screen flex-col bg-background text-foreground">
  //     </div>
  //   )
  // }

  return (
    <div className="flex h-full overflow-hidden">
      <ResizablePanelGroup orientation="vertical">
        <ResizablePanel>
          <ResizablePanelGroup orientation="horizontal">
            <ResizablePanel>

            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel maxSize={400}>

            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel maxSize={250}>
          <Timeline />
          {/* <EditorTimeline
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
      />  */}

        </ResizablePanel>
      </ResizablePanelGroup>
      {/* <div className="flex min-h-0 flex-1">
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
*/}
    </div>
  )
}
