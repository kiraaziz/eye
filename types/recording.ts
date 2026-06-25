export type TrackType = 'camera' | 'mic' | 'speaker' | 'screen'

export type RecordingConfig = {
  cameraId: string | null
  micId: string | null
  speakerId: string | null
  screenId: string | null
  quality?: 'low' | 'medium' | 'high' | 'ultra'
}

export type RecordingAssets = {
  camera: string | null
  mic: string | null
  speaker: string | null
  screen: string | null
  cameraThumbnail?: string | null
  screenThumbnail?: string | null
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

export type MouseEventEntry = {
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
  mouseEvents: MouseEventEntry[]
}

export type SavedRecording = RecordingResult & {
  sessionId: string
}

export type RecordingListItem = {
  sessionId: string
  startedAt: number
  durationMs: number
  hasScreen: boolean
  hasCamera: boolean
  hasMic: boolean
  hasSpeaker: boolean
}
