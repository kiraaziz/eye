import { useCallback, useRef, useState, useEffect } from 'react'

type MouseEventType = 'click' | 'mousedown' | 'mouseup' | 'scroll'
type MouseButton = 'left' | 'right' | 'middle'

const BUTTON_MAP: Record<number, MouseButton> = { 0: 'left', 1: 'middle', 2: 'right' }

/**
 * Captures click, mousedown, mouseup, and scroll events on the window.
 * Converts window-relative coords to absolute screen coords using
 * window.screenX / screenY (available in Electron renderer).
 *
 * Events are sent to the main process via ipcRenderer.send('record:mouseEvent').
 * The main process merges these with its own getCursorScreenPoint() move events.
 *
 * Call startTracking() when recording begins, stopTracking() when it ends.
 */
export function useMouseTracker() {
  const isTracking = useRef(false)

  const sendEvent = useCallback((
    type: MouseEventType,
    x: number,
    y: number,
    button?: MouseButton,
    scrollDelta?: { x: number; y: number }
  ) => {
    if (!isTracking.current) return

    // Convert to absolute screen coordinates
    const absX = Math.round(window.screenX + x)
    const absY = Math.round(window.screenY + y)

    window.ipcRenderer.send('record:mouseEvent', {
      t: 0,          // main process overwrites this with real elapsed time
      x: absX,
      y: absY,
      type,
      ...(button ? { button } : {}),
      ...(scrollDelta ? { scrollDelta } : {}),
    })
  }, [])

  const handleMouseDown = useCallback((e: globalThis.MouseEvent) => {
    sendEvent('mousedown', e.clientX, e.clientY, BUTTON_MAP[e.button])
  }, [sendEvent])

  const handleMouseUp = useCallback((e: globalThis.MouseEvent) => {
    sendEvent('mouseup', e.clientX, e.clientY, BUTTON_MAP[e.button])
  }, [sendEvent])

  const handleClick = useCallback((e: globalThis.MouseEvent) => {
    sendEvent('click', e.clientX, e.clientY, BUTTON_MAP[e.button])
  }, [sendEvent])

  const handleScroll = useCallback((e: WheelEvent) => {
    sendEvent('scroll', e.clientX, e.clientY, undefined, {
      x: Math.round(e.deltaX),
      y: Math.round(e.deltaY),
    })
  }, [sendEvent])

  const startTracking = useCallback(() => {
    if (isTracking.current) return
    isTracking.current = true
    window.addEventListener('mousedown', handleMouseDown, { capture: true })
    window.addEventListener('mouseup', handleMouseUp, { capture: true })
    window.addEventListener('click', handleClick, { capture: true })
    window.addEventListener('wheel', handleScroll, { capture: true, passive: true })
  }, [handleMouseDown, handleMouseUp, handleClick, handleScroll])

  const stopTracking = useCallback(() => {
    isTracking.current = false
    window.removeEventListener('mousedown', handleMouseDown, { capture: true })
    window.removeEventListener('mouseup', handleMouseUp, { capture: true })
    window.removeEventListener('click', handleClick, { capture: true })
    window.removeEventListener('wheel', handleScroll, { capture: true })
  }, [handleMouseDown, handleMouseUp, handleClick, handleScroll])

  // Safety cleanup if component unmounts mid-recording
  useEffect(() => () => stopTracking(), [stopTracking])

  return { startTracking, stopTracking }
}

export type RecordingConfig = {
  cameraId: string | null
  micId: string | null
  speakerId: string | null
  screenId: string | null
}

export type RecordingAssets = {
  camera: string | null
  mic: string | null
  speaker: string | null
  screen: string | null
}

export type DisplayInfo = {
  id: number
  label: string
  bounds: { x: number; y: number; width: number; height: number }
  workArea: { x: number; y: number; width: number; height: number }
  scaleFactor: number
  rotation: number
  isPrimary: boolean
}

export type RecordingMeta = {
  startedAt: number
  durationMs: number
  displays: DisplayInfo[]
  primaryDisplay: DisplayInfo
}

export type MouseEvent = {
  t: number
  x: number
  y: number
  type: 'move' | 'click' | 'mousedown' | 'mouseup' | 'scroll'
  button?: 'left' | 'right' | 'middle'
  scrollDelta?: { x: number; y: number }
}

export type RecordingResult = {
  config: RecordingConfig
  assets: RecordingAssets
  meta: RecordingMeta
  mouseEvents: MouseEvent[]
}

type TrackType = 'camera' | 'mic' | 'speaker' | 'screen'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function recordStream(
  stream: MediaStream,
  mimeType = 'video/webm;codecs=vp9,opus'
): { stop: () => void; result: Promise<ArrayBuffer> } {
  const chunks: Blob[] = []
  let resolveResult!: (buf: ArrayBuffer) => void
  let rejectResult!: (err: unknown) => void

  const result = new Promise<ArrayBuffer>((res, rej) => {
    resolveResult = res
    rejectResult = rej
  })

  const safeMime = MediaRecorder.isTypeSupported(mimeType)
    ? mimeType
    : MediaRecorder.isTypeSupported('video/webm')
      ? 'video/webm'
      : ''

  const recorder = new MediaRecorder(stream, safeMime ? { mimeType: safeMime } : {})

  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data)
  }

  recorder.onstop = async () => {
    try {
      const blob = new Blob(chunks, { type: recorder.mimeType || 'video/webm' })
      resolveResult(await blob.arrayBuffer())
    } catch (err) {
      rejectResult(err)
    }
  }

  recorder.onerror = rejectResult
  recorder.start(250)

  return {
    stop: () => { if (recorder.state !== 'inactive') recorder.stop() },
    result,
  }
}

async function saveTrack(type: TrackType, buffer: ArrayBuffer, sessionId: string): Promise<string> {
  const { filePath } = await window.ipcRenderer.invoke('record:saveTrack', {
    type, buffer, sessionId, ext: 'webm',
  })
  return filePath
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useStartRecording(config: RecordingConfig) {
  const [isRecording, setIsRecording] = useState(false)
  const [result, setResult] = useState<RecordingResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const stoppers = useRef<Array<() => void>>([])
  const streamsRef = useRef<MediaStream[]>([])
  const { startTracking, stopTracking } = useMouseTracker()

  const start = useCallback(async () => {
    if (isRecording) return
    setError(null)
    setResult(null)
    setIsRecording(true)

    // Ask main to start session → get sessionId, screen metadata, startedAt
    const { sessionId, displays, primaryDisplay, startedAt } =
      await window.ipcRenderer.invoke('record:start')

    const recorders: Array<{ type: TrackType; stop: () => void; result: Promise<ArrayBuffer> }> = []
    const streams: MediaStream[] = []

    try {
      // 1. Microphone
      if (config.micId && config.micId !== 'none') {
        const micStream = await navigator.mediaDevices.getUserMedia({
          audio: { deviceId: { exact: config.micId } },
          video: false,
        })
        streams.push(micStream)
        const rec = recordStream(new MediaStream(micStream.getAudioTracks()), 'audio/webm;codecs=opus')
        recorders.push({ type: 'mic', ...rec })
      }

      // 2. Speaker loopback
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

      // 3. Camera (video only, no audio)
      if (config.cameraId && config.cameraId !== 'none') {
        const camStream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: { exact: config.cameraId } },
          audio: false,
        })
        streams.push(camStream)
        const rec = recordStream(camStream, 'video/webm;codecs=vp9')
        recorders.push({ type: 'camera', ...rec })
      }

      // 4. Screen / window (no audio — system audio captured via loopback)
      if (config.screenId && config.screenId !== 'none') {
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
        const rec = recordStream(screenStream, 'video/webm;codecs=vp9')
        recorders.push({ type: 'screen', ...rec })
      }

      streamsRef.current = streams
      stoppers.current = recorders.map((r) => r.stop)

      // Start capturing click/scroll events from the renderer side
      startTracking()

    } catch (err) {
      setError(String(err))
      setIsRecording(false)
      streams.forEach((s) => s.getTracks().forEach((t) => t.stop()))
      return
    }

    // Return async stop function
    return async () => {
      const durationMs = Date.now() - startedAt

      // Stop click/scroll tracking
      stopTracking()

      // Stop all MediaRecorders and tracks
      recorders.forEach((r) => r.stop())
      streamsRef.current.forEach((s) => s.getTracks().forEach((t) => t.stop()))

      try {
        const buffers = await Promise.all(recorders.map((r) => r.result))

        const savedPaths: Partial<RecordingAssets> = {}
        for (let i = 0; i < recorders.length; i++) {
          savedPaths[recorders[i].type] = await saveTrack(recorders[i].type, buffers[i], sessionId)
        }

        const recordingResult: RecordingResult = await window.ipcRenderer.invoke('record:finalise', {
          sessionId,
          config,
          savedPaths,
          durationMs,
        })

        setResult(recordingResult)
      } catch (err) {
        setError(String(err))
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

  return { start, stop, isRecording, result, error }
}