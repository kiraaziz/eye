import {
  AbsoluteFill,
  Audio,
  OffthreadVideo,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion'
import { useRef } from 'react'
import type { ClipTracks, ZoomSegment, ZoomSettings } from '@/lib/editor/types'
import { getRecordedDisplay } from '@/lib/editor/display'
import { computeCameraAtTime } from '@/lib/editor/zoom'
import type { DisplayPoint } from '@/lib/editor/mouse'
import { RecordingResult } from 'types/recording'

export type RecordingCompositionProps = {
  data: RecordingResult
  clips: ClipTracks
  zoomSegments: ZoomSegment[]
  zoomSettings: ZoomSettings
}


function ScreenLayer({
  src,
  displayWidth,
  displayHeight,
  camera,
  startFrom,
}: {
  src: string
  displayWidth: number
  displayHeight: number
  camera: { scale: number; focalX: number; focalY: number }
  startFrom: number
}) {
  const { scale, focalX, focalY } = camera

  return (
    <div
      style={{
        width: displayWidth,
        height: displayHeight,
        transform: `scale(${scale})`,
        transformOrigin: `${focalX}px ${focalY}px`,
        willChange: 'transform',
      }}
    >
      <OffthreadVideo
        src={src}
        startFrom={startFrom}
        style={{
          width: displayWidth,
          height: displayHeight,
          objectFit: 'cover',
          display: 'block',
        }}
      />
    </div>
  )
}

export function RecordingComposition({
  data,
  clips,
  zoomSegments,
  zoomSettings,
}: RecordingCompositionProps) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const timeMs = (frame / fps) * 1000

  const display = getRecordedDisplay(data)
  const { width, height } = display.bounds

  const glideRef = useRef<{ prev: DisplayPoint | null }>({ prev: null })
  const glideCache = zoomSettings.glide
    ? { prev: glideRef.current.prev, alpha: 0.12 }
    : undefined

  const camera = computeCameraAtTime(
    timeMs,
    zoomSegments,
    data.mouseEvents,
    display,
    zoomSettings,
    glideCache
  )

  if (zoomSettings.glide) {
    glideRef.current.prev = { x: camera.focalX, y: camera.focalY }
  }

  const screenSrc = data.assets.screen
  const cameraSrc = data.assets.camera
  const micSrc = data.assets.mic
  const speakerSrc = data.assets.speaker

  const screenOffsetFrames = Math.round((clips.screen.startMs / 1000) * fps)
  const micOffsetFrames = Math.round((clips.mic.startMs / 1000) * fps)
  const speakerOffsetFrames = Math.round((clips.speaker.startMs / 1000) * fps)

  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(135deg, #e85d4c 0%, #c73e54 50%, #8b2e5c 100%)',
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          width,
          height,
          borderRadius: 12,
          overflow: 'hidden',
          boxShadow: '0 25px 80px rgba(0,0,0,0.45)',
          position: 'relative',
        }}
      >
        {screenSrc && (
          <ScreenLayer
            src={screenSrc}
            displayWidth={width}
            displayHeight={height}
            camera={camera}
            startFrom={screenOffsetFrames}
          />
        )}

        {cameraSrc && (
          <div
            style={{
              position: 'absolute',
              bottom: 24,
              left: 24,
              width: 200,
              height: 150,
              borderRadius: 12,
              overflow: 'hidden',
              border: '2px solid rgba(255,255,255,0.3)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            }}
          >
            <OffthreadVideo
              src={cameraSrc}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        )}
      </div>

      {micSrc && (
        <Audio src={micSrc} startFrom={micOffsetFrames} />
      )}
      {speakerSrc && (
        <Audio src={speakerSrc} startFrom={speakerOffsetFrames} />
      )}
    </AbsoluteFill>
  )
}
