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