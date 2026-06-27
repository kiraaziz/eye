import { useEffect, useState, useRef } from 'react'
import { toast } from "sonner"
import { UseGetSourcesReturn } from 'types/configs'

export const QUALITY_PRESETS = {
    low: { width: 1280, height: 720, frameRate: 24, videoBitsPerSecond: 2_500_000, audioBitsPerSecond: 96_000 },
    medium: { width: 1920, height: 1080, frameRate: 30, videoBitsPerSecond: 6_000_000, audioBitsPerSecond: 128_000 },
    high: { width: 1920, height: 1080, frameRate: 60, videoBitsPerSecond: 12_000_000, audioBitsPerSecond: 160_000 },
    ultra: { width: 2560, height: 1440, frameRate: 60, videoBitsPerSecond: 20_000_000, audioBitsPerSecond: 192_000 },
} as const

export function getSources(): UseGetSourcesReturn {
    const [cameras, setCameras] = useState<MediaDeviceInfo[]>([])
    const [microphones, setMicrophones] = useState<MediaDeviceInfo[]>([])
    const [speakers, setSpeakers] = useState<MediaDeviceInfo[]>([])
    const [screens, setScreens] = useState<any[]>([])
    const [error, setError] = useState(false)
    const [loading, setLoading] = useState(true)

    const retryTimeout = useRef<NodeJS.Timeout | null>(null)

    async function loadDevices() {
        try {
            setError(false)

            await navigator.mediaDevices.getUserMedia({ video: true, audio: true })

            const devices = await navigator.mediaDevices.enumerateDevices()
            const sources = await window.ipcRenderer.invoke("screen:getSources")

            setScreens(sources)
            setCameras(devices.filter((d) => d.kind === "videoinput"))
            setMicrophones(devices.filter((d) => d.kind === "audioinput"))
            setSpeakers(devices.filter((d) => d.kind === "audiooutput"))

            await window.ipcRenderer.invoke("window:toggleMode", "overlay")
        } catch (err) {
            toast.error("Unable to access camera, microphone, or screen sources")
            setError(true)

            retryTimeout.current = setTimeout(() => {
                loadDevices()
            }, 3000)

        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadDevices()

        return () => {
            if (retryTimeout.current) {
                clearTimeout(retryTimeout.current)
            }
        }
    }, [])

    return {
        cameras,
        microphones,
        speakers,
        screens,
        loading,
        error,
        retry: loadDevices
    }
}