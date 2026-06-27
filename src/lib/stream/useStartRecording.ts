import type {
  RecordingAssets,
  RecordingConfig,
  SavedRecording,
  TrackType
} from '@/types/recording'
import { useCallback, useRef, useState } from 'react'
import { useMouseTracker } from './mouse/useMouseTracker'
import { recordStream } from './recordStream'
import { saveTrack } from './saveTrack'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { QUALITY_PRESETS } from '../configs/qualityPresets'
import { captureThumbnail } from './captureThumbnail'

export async function saveThumbnail(
  type: 'camera' | 'screen',
  buffer: ArrayBuffer,
  sessionId: string
): Promise<string> {
  const { filePath } = await window.ipcRenderer.invoke('record:saveThumbnail', { type, buffer, sessionId })
  return filePath
}

export function useStartRecording(config: RecordingConfig) {
  const navigate = useNavigate()

  const [isRecording, setIsRecording] = useState(false)

  const stoppers = useRef<Array<() => void>>([])
  const streamsRef = useRef<MediaStream[]>([])
  const { startTracking, stopTracking } = useMouseTracker()

  const start = useCallback(async () => {
    if (isRecording) return
    setIsRecording(true)

    const quality = QUALITY_PRESETS[config.quality ?? 'medium']

    let { sessionId, startedAt } = await window.ipcRenderer.invoke('record:start')

    const recorders: Array<{ type: TrackType; stop: () => void; result: Promise<ArrayBuffer> }> = []
    const streams: MediaStream[] = []
    const thumbnails: Partial<Record<TrackType, Blob>> = {}

    try {
      window.ipcRenderer.invoke('window:minimize')

      if (config.micId && config.micId !== 'none') {
        const micStream = await navigator.mediaDevices.getUserMedia({
          audio: { deviceId: { exact: config.micId } },
          video: false,
        })
        streams.push(micStream)
        const rec = recordStream(
          new MediaStream(micStream.getAudioTracks()),
          'audio/webm;codecs=opus',
          { audioBitsPerSecond: quality.audioBitsPerSecond }
        )
        recorders.push({ type: 'mic', ...rec })
      }

      if (config.speakerId && config.speakerId !== 'none') {
        try {
          const speakerStream = await navigator.mediaDevices.getUserMedia({
            audio: { deviceId: { exact: config.speakerId } },
            video: false,
          })
          streams.push(speakerStream)
          const rec = recordStream(
            new MediaStream(speakerStream.getAudioTracks()),
            'audio/webm;codecs=opus',
            { audioBitsPerSecond: quality.audioBitsPerSecond }
          )
          recorders.push({ type: 'speaker', ...rec })
        } catch {
          console.warn('[useStartRecording] Speaker/loopback capture failed – skipping.')
        }
      }

      if (config.cameraId && config.cameraId !== 'none') {
        const camStream = await navigator.mediaDevices.getUserMedia({
          video: {
            deviceId: { exact: config.cameraId },
            width: { ideal: quality.width },
            height: { ideal: quality.height },
            frameRate: { ideal: quality.frameRate },
          },
          audio: false,
        })
        streams.push(camStream)
        thumbnails.camera = await captureThumbnail(camStream)
        const rec = recordStream(camStream, 'video/webm;codecs=vp9', { videoBitsPerSecond: quality.videoBitsPerSecond })
        recorders.push({ type: 'camera', ...rec })
      }

      if (config.screenId) {
        const screenStream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            // @ts-expect-error – Electron-specific constraint
            mandatory: {
              chromeMediaSource: 'desktop',
              chromeMediaSourceId: config.screenId,
              minWidth: quality.width,
              maxWidth: quality.width,
              minHeight: quality.height,
              maxHeight: quality.height,
              maxFrameRate: quality.frameRate,
            },
          },
        })
        streams.push(screenStream)
        thumbnails.screen = await captureThumbnail(screenStream)

        const { startedAt: trueStartedAt } = await window.ipcRenderer.invoke('record:syncTimeline')
        startedAt = trueStartedAt

        const rec = recordStream(screenStream, 'video/webm;codecs=vp9', { videoBitsPerSecond: quality.videoBitsPerSecond })
        recorders.push({ type: 'screen', ...rec })
      }

      streamsRef.current = streams
      stoppers.current = recorders.map((r) => r.stop)

      startTracking()

    } catch (err) {
      toast.error("Something went wrong. Retrying recording.")
      setIsRecording(false)
      streams.forEach((s) => s.getTracks().forEach((t) => t.stop()))
      return
    }

    return async () => {
      const durationMs = Date.now() - startedAt
      stopTracking()
      recorders.forEach((r) => r.stop())
      streamsRef.current.forEach((s) => s.getTracks().forEach((t) => t.stop()))

      try {
        const buffers = await Promise.all(recorders.map((r) => r.result))

        const savedPaths: Partial<RecordingAssets> = {}
        for (let i = 0; i < recorders.length; i++) {
          savedPaths[recorders[i].type] = await saveTrack(recorders[i].type, buffers[i], sessionId)
        }

        // persist thumbnails alongside the tracks
        for (const [type, blob] of Object.entries(thumbnails)) {
          if (blob) await saveTrack(`${type}-thumb` as TrackType, await blob.arrayBuffer(), sessionId)
        }

        const thumbnailPaths: Partial<Record<'camera' | 'screen', string>> = {}
        for (const [type, blob] of Object.entries(thumbnails)) {
          if (blob) {
            thumbnailPaths[type as 'camera' | 'screen'] = await saveThumbnail(
              type as 'camera' | 'screen',
              await blob.arrayBuffer(),
              sessionId
            )
          }
        }

        const recordingResult: SavedRecording = await window.ipcRenderer.invoke('record:finalise', {
          sessionId,
          config,
          savedPaths,
          thumbnailPaths,
          durationMs,
        })

        navigate({ to: '/e/$sessionId', params: { sessionId: recordingResult.sessionId } })

      } catch (err) {
        toast.error("Something went wrong. Failed to save.");
      } finally {
        setIsRecording(false)
        stoppers.current = []
        streamsRef.current = []
      }
    }
  }, [config, isRecording, startTracking, stopTracking])

  const stop = useCallback(() => {
    stoppers.current.forEach((fn) => fn())
  }, [])

  return { start, stop, isRecording }
}