export type MouseEventType = 'move' | 'click' | 'mousedown' | 'mouseup' | 'scroll'
export type MouseButton = 'left' | 'right' | 'middle'

export type MouseEventEntry = {
  t: number
  x: number
  y: number
  type: MouseEventType
  button?: MouseButton
  scrollDelta?: { x: number; y: number }
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

export type RecordingResult = {
  config: RecordingConfig
  assets: RecordingAssets
  meta: RecordingMeta
  mouseEvents: MouseEventEntry[]
}