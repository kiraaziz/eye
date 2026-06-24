import { useEffect, useState } from 'react'
import { toast } from "sonner"

export function useGetSources() {
    const [cameras, setCameras] = useState<MediaDeviceInfo[]>([])
    const [microphones, setMicrophones] = useState<MediaDeviceInfo[]>([])
    const [speakers, setSpeakers] = useState<MediaDeviceInfo[]>([])
    const [screens, setScreens] = useState<any[]>([])
    const [error, setError] = useState(false)
    const [loading, setLoading] = useState(true)

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
        } catch {
            toast.error("Unable to access camera, microphone, or screen sources")
            setError(true)
        } finally {
            setLoading(false)
        }
    }


    useEffect(() => {
        loadDevices()
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
