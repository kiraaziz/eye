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

export function useStartRecording(config: RecordingConfig) {
  const navigate = useNavigate()

  const [isRecording, setIsRecording] = useState(false)

  const stoppers = useRef<Array<() => void>>([])
  const streamsRef = useRef<MediaStream[]>([])
  const { startTracking, stopTracking } = useMouseTracker()

  const start = useCallback(async () => {
    if (isRecording) return
    setIsRecording(true)

    let { sessionId, startedAt } = await window.ipcRenderer.invoke('record:start')

    const recorders: Array<{ type: TrackType; stop: () => void; result: Promise<ArrayBuffer> }> = []
    const streams: MediaStream[] = []

    try {

      // FOR MIC - note write by kira , not slopy AI
      if (config.micId && config.micId !== 'none') {
        const micStream = await navigator.mediaDevices.getUserMedia({
          audio: { deviceId: { exact: config.micId } },
          video: false,
        })
        streams.push(micStream)
        const rec = recordStream(new MediaStream(micStream.getAudioTracks()), 'audio/webm;codecs=opus')
        recorders.push({ type: 'mic', ...rec })
      }

      // FOR SPEAKER - I guess it's broken for now
      if (config.speakerId && config.speakerId !== 'none') {
        try {
          const speakerStream = await navigator.mediaDevices.getUserMedia({
            audio: { deviceId: { exact: config.speakerId } },
            video: false,
          })
          streams.push(speakerStream)
          const rec = recordStream(new MediaStream(speakerStream.getAudioTracks()), 'audio/webm;codecs=opus')
          recorders.push({ type: 'speaker', ...rec })
        } catch {
          console.warn('[useStartRecording] Speaker/loopback capture failed – skipping.')
        }
      }

      // FOR CAM
      if (config.cameraId && config.cameraId !== 'none') {
        const camStream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: { exact: config.cameraId } },
          audio: false,
        })
        streams.push(camStream)
        const rec = recordStream(camStream, 'video/webm;codecs=vp9')
        recorders.push({ type: 'camera', ...rec })
      }

      // FOR SCREEN
      if (config.screenId) {
        const screenStream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            // @ts-expect-error – Electron-specific constraint
            mandatory: {
              chromeMediaSource: 'desktop',
              chromeMediaSourceId: config.screenId,
            },
          },
        })
        streams.push(screenStream)

        const { startedAt: trueStartedAt } = await window.ipcRenderer.invoke('record:syncTimeline')
        startedAt = trueStartedAt

        const rec = recordStream(screenStream, 'video/webm;codecs=vp9')
        recorders.push({ type: 'screen', ...rec })
      }

      streamsRef.current = streams
      stoppers.current = recorders.map((r) => r.stop)

      startTracking()
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

        const recordingResult: SavedRecording = await window.ipcRenderer.invoke('record:finalise', {
          sessionId,
          config,
          savedPaths,
          durationMs,
        })

        navigate({
          to: '/e/$sessionId',
          params: { sessionId: recordingResult.sessionId }
        })

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