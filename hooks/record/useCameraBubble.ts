import { useEffect, useRef, useState } from "react"

const BUBBLE_SIZE = { w: 192, h: 144 }
const MARGIN = 20

export function useCameraBubble(cameraId: string | null) {

    const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
    const [bubblePos, setBubblePos] = useState({ x: 20, y: 20 })
    const [dragging, setDragging] = useState(false)
    const dragOffset = useRef({ x: 0, y: 0 })


    const selectedCamera = cameraId === "none" ? null : cameraId

    function clampBubble(x: number, y: number) {
        const maxX = window.innerWidth - BUBBLE_SIZE.w - MARGIN
        const maxY = window.innerHeight - BUBBLE_SIZE.h - MARGIN

        return {
            x: Math.max(MARGIN, Math.min(x, maxX)),
            y: Math.max(MARGIN, Math.min(y, maxY)),
        }
    }

    useEffect(() => {
        async function startCamera() {
            if (!selectedCamera) {
                setCameraStream(null)
                return
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                video: { deviceId: { exact: selectedCamera } },
                audio: false,
            })

            setCameraStream(stream)
        }

        startCamera()

        return () => {
            cameraStream?.getTracks().forEach((t) => t.stop())
        }
    }, [selectedCamera])

    useEffect(() => {
        function onMove(e: MouseEvent) {
            if (!dragging) return

            const next = {
                x: e.clientX - dragOffset.current.x,
                y: e.clientY - dragOffset.current.y,
            }

            setBubblePos(clampBubble(next.x, next.y))
        }

        function onUp() {
            setDragging(false)
        }

        window.addEventListener("mousemove", onMove)
        window.addEventListener("mouseup", onUp)

        return () => {
            window.removeEventListener("mousemove", onMove)
            window.removeEventListener("mouseup", onUp)
        }
    }, [dragging])

    const videoRef = useRef<HTMLVideoElement | null>(null)
    useEffect(() => {
        if (videoRef.current && cameraStream) {
            videoRef.current.srcObject = cameraStream
        }
    }, [cameraStream])

    return {
        bubblePos,
        cameraStream,
        dragOffset,
        setDragging, 
        videoRef
    }
}
