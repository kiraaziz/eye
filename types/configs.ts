import { QUALITY_PRESETS } from "@/lib/panel/getSources"
import { ScreenSource } from "./screen"

export interface UseGetSourcesReturn {
    cameras: MediaDeviceInfo[]
    microphones: MediaDeviceInfo[]
    speakers: MediaDeviceInfo[]
    screens: ScreenSource[]
    error: boolean
    loading: boolean
    retry: () => Promise<void>
}

export type TrackType = 'camera' | 'mic' | 'speaker' | 'screen'

export type RecordingAssets = Record<TrackType, string | null>

export type RecordingConfig = {
    [K in TrackType as `${K}Id`]: string | null
} & { quality: QualityPreset }

export type QualityPreset = keyof typeof QUALITY_PRESETS
export type StreamQuality = (typeof QUALITY_PRESETS)[QualityPreset]
