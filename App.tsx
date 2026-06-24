import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

const NONE = "none"
const BUBBLE_SIZE = { w: 192, h: 144 } // matches w-48 h-36
const MARGIN = 20

export default function Settings() {
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([])
  const [microphones, setMicrophones] = useState<MediaDeviceInfo[]>([])
  const [speakers, setSpeakers] = useState<MediaDeviceInfo[]>([])
  const [screens, setScreens] = useState<any[]>([])

  const [cameraId, setCameraId] = useState(NONE)
  const [micId, setMicId] = useState(NONE)
  const [speakerId, setSpeakerId] = useState(NONE)
  const [screenId, setScreenId] = useState("")

  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)

  const [bubblePos, setBubblePos] = useState({ x: 20, y: 20 })
  const [dragging, setDragging] = useState(false)
  const dragOffset = useRef({ x: 0, y: 0 })

  useEffect(() => {
    async function loadDevices() {
      // required to unlock device labels
      await navigator.mediaDevices.getUserMedia({ video: true, audio: true })

      const devices = await navigator.mediaDevices.enumerateDevices()
      const sources = await window.ipcRenderer.invoke("screen:getSources")

      setScreens(sources)
      setCameras(devices.filter((d) => d.kind === "videoinput"))
      setMicrophones(devices.filter((d) => d.kind === "audioinput"))
      setSpeakers(devices.filter((d) => d.kind === "audiooutput"))
    }

    loadDevices()
  }, [])

  const selectedCamera = cameraId === NONE ? null : cameraId

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

  const handleSelectScreen = async (id: string) => {
    setScreenId(id)

    alert(id)
    await window.ipcRenderer.invoke(
      "screen:setSource",
      id
    )
  }

  const [micLevel, setMicLevel] = useState(0)
  const micAnalyserRef = useRef<AnalyserNode | null>(null)
  const micDataArrayRef = useRef<Uint8Array | null>(null)


  useEffect(() => {
    if (!micId || micId === NONE) return

    let stream: MediaStream
    let audioCtx: AudioContext
    let raf: number

    async function startMic() {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: { exact: micId } },
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

        // compute volume (0–1)
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


  const [speakerLevel, setSpeakerLevel] = useState(0)
  const loopbackStreamRef = useRef<MediaStream | null>(null)

  async function getLoopbackAudioMediaStream(): Promise<MediaStream> {
    // tell main to swap getDisplayMedia's behavior to loopback audio
    await window.ipcRenderer.invoke("enable-loopback-audio")

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true, // the API requires this even though we only want audio
        audio: true,
      })

      // we don't need the video track at all
      stream.getVideoTracks().forEach((t) => {
        stream.removeTrack(t)
        t.stop()
      })

      return stream
    } finally {
      await window.ipcRenderer.invoke("disable-loopback-audio")
    }
  }

  useEffect(() => {
    if (speakerId === NONE) {
      loopbackStreamRef.current?.getTracks().forEach((t) => t.stop())
      loopbackStreamRef.current = null
      setSpeakerLevel(0)
      return
    }

    let raf: number
    let audioCtx: AudioContext

    async function startMeter() {
      const stream = await getLoopbackAudioMediaStream()
      loopbackStreamRef.current = stream

      audioCtx = new AudioContext()
      const source = audioCtx.createMediaStreamSource(stream)
      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 512
      const dataArray = new Uint8Array(analyser.frequencyBinCount)
      source.connect(analyser)

      const tick = () => {
        analyser.getByteFrequencyData(dataArray)
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length
        setSpeakerLevel(avg / 255)
        raf = requestAnimationFrame(tick)
      }
      tick()
    }

    startMeter()

    return () => {
      cancelAnimationFrame(raf)
      loopbackStreamRef.current?.getTracks().forEach((t) => t.stop())
      audioCtx?.close()
    }
  }, [speakerId])

  return (
    <div className="w-full h-full border border-dashed">
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-semibold">Recording Settings</h1>
        {cameraStream && (
          <div
            className="fixed z-50 w-48 h-36 rounded-xl overflow-hidden shadow-xl border bg-black cursor-move select-none"
            style={{
              left: bubblePos.x,
              top: bubblePos.y,
              position: "fixed",
            }}
            onMouseDown={(e) => {
              setDragging(true)
              dragOffset.current = {
                x: e.clientX - bubblePos.x,
                y: e.clientY - bubblePos.y,
              }
            }}
            onDragStart={(e) => e.preventDefault()}
          >
            <video
              autoPlay
              muted
              ref={videoRef}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        {/* CAMERA */}
        <Card>
          <CardHeader>
            <CardTitle>Camera</CardTitle>
          </CardHeader>
          <CardContent>
            <Label>Select camera</Label>

            <Select value={cameraId} onValueChange={setCameraId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose camera" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value={NONE}>None</SelectItem>

                {cameras.map((c) => (
                  <SelectItem key={c.deviceId} value={c.deviceId}>
                    {c.label || "Camera"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* MICROPHONE */}
        <Card>
          <CardHeader>
            <CardTitle>Microphone</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="w-3 h-3 rounded-full bg-green-500"
              style={{
                transform: `scale(${1 + micLevel * 2})`,
                opacity: 0.5 + micLevel
              }}
            />
            <Label>Select microphone</Label>

            <Select value={micId} onValueChange={setMicId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose microphone" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value={NONE}>None</SelectItem>

                {microphones.map((m) => (
                  <SelectItem key={m.deviceId} value={m.deviceId}>
                    {m.label || "Microphone"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* SPEAKER */}
        <Card>
          <CardHeader>
            <CardTitle>Speaker</CardTitle>
          </CardHeader>
          <CardContent>
            <Label>Select speaker</Label>
            <div
              className="w-3 h-3 rounded-full bg-green-500"
              style={{
                transform: `scale(${1 + speakerLevel * 2})`,
                opacity: 0.5 + speakerLevel,
              }}
            />
            <Select value={speakerId} onValueChange={setSpeakerId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose speaker" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value={NONE}>None</SelectItem>

                {speakers.map((s) => (
                  <SelectItem key={s.deviceId} value={s.deviceId}>
                    {s.label || "Speaker"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* SCREEN SHARE */}
        <Card>
          <CardHeader>
            <CardTitle>Screen Share</CardTitle>
          </CardHeader>

          <CardContent>
            <Tabs defaultValue="screen" className="w-full">
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="screen">Screen</TabsTrigger>
                <TabsTrigger value="window">Window / App</TabsTrigger>
              </TabsList>

              {/* SCREEN */}
              <TabsContent value="screen" className="mt-4">
                <Label>Select screen</Label>

                <div className="grid grid-cols-2 gap-3">
                  {screens
                    .filter((s) => s.id.startsWith("screen"))
                    .map((s) => (
                      <button
                        key={s.id}
                        onClick={() => handleSelectScreen(s.display_id)}
                        className={`border rounded-lg p-2 hover:bg-muted transition ${screenId === s.id ? "border-primary" : ""
                          }`}
                      >
                        <img src={s.thumbnail} className="w-full rounded-md mb-2" />
                        <p className="text-xs truncate">{s.name}</p>
                      </button>
                    ))}
                </div>
              </TabsContent>

              {/* WINDOW */}
              <TabsContent value="window" className="mt-4">
                <div className="grid grid-cols-2 gap-3">
                  {screens
                    .filter((s) => s.id.startsWith("window"))
                    .map((s) => (
                      <button
                        key={s.id}
                        onClick={() => handleSelectScreen(s.display_id)}
                        className={`border rounded-lg p-2 hover:bg-muted transition ${screenId === s.id ? "border-primary" : ""
                          }`}
                      >
                        <img src={s.thumbnail} className="w-full rounded-md mb-2" />
                        <p className="text-xs truncate">{s.name}</p>
                      </button>
                    ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}