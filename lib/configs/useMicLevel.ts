import { useEffect, useRef, useState } from "react"

export function useMicLevel(micId: string | null) {

    const [micLevel, setMicLevel] = useState(0)
    const micAnalyserRef = useRef<AnalyserNode | null>(null)
    const micDataArrayRef = useRef<Uint8Array | null>(null)


    useEffect(() => {
        if (!micId || micId === "none") return

        let stream: MediaStream
        let audioCtx: AudioContext
        let raf: number

        async function startMic() {
            stream = await navigator.mediaDevices.getUserMedia({
                audio: { deviceId: { exact: micId as string } },
            })

            audioCtx = new AudioContext()
            const source = audioCtx.createMediaStreamSource(stream)

            const analyser = audioCtx.createAnalyser()
            analyser.fftSize = 512

            const dataArray = new Uint8Array(analyser.frequencyBinCount)

            source.connect(analyser)

            micAnalyserRef.current = analyser
            micDataArrayRef.current = dataArray

            const tick = () => {
                analyser.getByteFrequencyData(dataArray)

                const avg =
                    dataArray.reduce((a, b) => a + b, 0) / dataArray.length

                setMicLevel(avg / 255)

                raf = requestAnimationFrame(tick)
            }

            tick()
        }

        startMic()

        return () => {
            cancelAnimationFrame(raf)
            stream?.getTracks().forEach(t => t.stop())
            audioCtx?.close()
        }
    }, [micId])

    return {
        micLevel
    }
}
