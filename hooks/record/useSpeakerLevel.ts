import { useEffect, useRef, useState } from "react"

export function useSpeakerLevel(active: boolean) {
    const [speakerLevel, setSpeakerLevel] = useState(0)
    const loopbackStreamRef = useRef<MediaStream | null>(null)
    const audioCtxRef = useRef<AudioContext | null>(null)
    const rafRef = useRef<number>(0)

    function stopAll() {
        cancelAnimationFrame(rafRef.current)
        loopbackStreamRef.current?.getTracks().forEach((t) => t.stop())
        loopbackStreamRef.current = null
        audioCtxRef.current?.close()
        audioCtxRef.current = null
        setSpeakerLevel(0)
    }

    useEffect(() => {
        if (!active) {
            stopAll()
            return
        }

        async function startMeter() {
            try {
                await (window as any).ipcRenderer.invoke("enable-loopback-audio")

                const stream = await navigator.mediaDevices.getDisplayMedia({
                    video: true,
                    audio: true,
                })

                await (window as any).ipcRenderer.invoke("disable-loopback-audio")

                stream.getVideoTracks().forEach((t) => {
                    stream.removeTrack(t)
                    t.stop()
                })

                loopbackStreamRef.current = stream
                const audioCtx = new AudioContext()
                audioCtxRef.current = audioCtx
                const source = audioCtx.createMediaStreamSource(stream)
                const analyser = audioCtx.createAnalyser()
                analyser.fftSize = 512
                const dataArray = new Uint8Array(analyser.frequencyBinCount)
                source.connect(analyser)

                const tick = () => {
                    analyser.getByteFrequencyData(dataArray)
                    const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length
                    setSpeakerLevel(avg / 255)
                    rafRef.current = requestAnimationFrame(tick)
                }
                tick()
            } catch (err) {
                console.error("Speaker meter failed:", err)
                setSpeakerLevel(0)
            }
        }

        startMeter()
        return () => stopAll()
    }, [active])

    return { speakerLevel }
}
