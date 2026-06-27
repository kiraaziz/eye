import { RecordingAssets, RecordingConfig } from "./configs"
import { MouseEventEntry } from "./mouse"
import { DisplayInfo } from "./screen"

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
    screenThumbnail: string | null
    cameraThumbnail: string | null
}