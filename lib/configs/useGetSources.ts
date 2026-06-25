import { useEffect, useState, useRef } from 'react'
import { toast } from "sonner"
import { UseGetSourcesReturn } from "@/types/sources"

export function useGetSources(): UseGetSourcesReturn {
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
            const sources = await (window as any).ipcRenderer.invoke("screen:getSources")

            setScreens(sources)
            setCameras(devices.filter((d) => d.kind === "videoinput"))
            setMicrophones(devices.filter((d) => d.kind === "audioinput"))
            setSpeakers(devices.filter((d) => d.kind === "audiooutput"))

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
        error,
        loading,
        retry: loadDevices
    }
}