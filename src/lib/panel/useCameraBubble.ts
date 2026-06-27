import { useEffect, useRef, useState } from "react"

export function useCameraBubble(cameraId: string | null) {
    const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
    const videoRef = useRef<HTMLVideoElement | null>(null)
    const selectedCamera = cameraId === "none" ? null : cameraId

    useEffect(() => {
        let stream: MediaStream | null = null

        async function startCamera() {
            if (!selectedCamera) {
                setCameraStream(null)
                return
            }
            stream = await navigator.mediaDevices.getUserMedia({
                video: { deviceId: { exact: selectedCamera } },
                audio: false,
            })
            setCameraStream(stream)
        }

        startCamera()
        return () => { stream?.getTracks().forEach((t) => t.stop()) }
    }, [selectedCamera])

    useEffect(() => {
        if (videoRef.current && cameraStream) {
            videoRef.current.srcObject = cameraStream
        }
    }, [cameraStream])

    return { cameraStream, videoRef }
}