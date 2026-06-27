import { Player, type PlayerRef } from '@remotion/player'
import { useMemo, useRef } from 'react'
import type { RecordingResult } from '@/lib/types/recording'
import type { ClipTracks, ZoomSegment, ZoomSettings } from '@/lib/editor/types'
import { FPS } from '@/lib/editor/types'
import { getRecordedDisplay } from '@/lib/editor/display'
import {
  RecordingComposition,
  type RecordingCompositionProps,
} from './remotion/RecordingComposition'

type EditorPreviewProps = {
  data: RecordingResult
  clips: ClipTracks
  zoomSegments: ZoomSegment[]
  zoomSettings: ZoomSettings
  isPlaying: boolean
  playerRef?: React.RefObject<PlayerRef | null>
}

export function EditorPreview({
  data,
  clips,
  zoomSegments,
  zoomSettings,
  isPlaying,
  playerRef: externalRef,
}: EditorPreviewProps) {
  const internalRef = useRef<PlayerRef>(null)
  const playerRef = externalRef ?? internalRef

  const durationInFrames = Math.max(
    1,
    Math.ceil((data.meta.durationMs / 1000) * FPS)
  )

  const display = getRecordedDisplay(data)
  const { width, height } = display.bounds

  const inputProps = useMemo(() => ({
    data,
    clips,
    zoomSegments,
    zoomSettings
  }), [data, clips, zoomSegments, zoomSettings])

  return (
    <div className="relative flex flex-1 items-center justify-center overflow-hidden rounded-xl bg-black/40 p-6">
      <Player
        ref={playerRef as any}
        component={RecordingComposition}
        inputProps={inputProps}
        durationInFrames={durationInFrames}
        compositionWidth={width}
        compositionHeight={height}
        fps={FPS}
        style={{ width: '100%', maxHeight: '100%', aspectRatio: '16/9' }}
        controls={false}
        loop={false}
        clickToPlay={false}
        spaceKeyToPlayOrPause={false}
        initiallyMuted={false}
        playbackRate={1}
        autoPlay={isPlaying}
        acknowledgeRemotionLicense
      />
    </div>
  )
}

export type { PlayerRef }
