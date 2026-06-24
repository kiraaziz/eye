import { createFileRoute } from '@tanstack/react-router'
// import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { ModeToggle } from '@/components/global/mode-toggle'
import { useGetSources } from "@/hooks/record/useGetSources"
import { useMicLevel } from "@/hooks/record/useMicLevel"
import { useSpeakerLevel } from "@/hooks/record/useSpeakerLevel"
import { useCameraBubble } from "@/hooks/record/useCameraBubble"
import { XMarkIcon } from '@heroicons/react/24/solid'
import { Button } from '@/components/ui/button'
import { FolderOpen, Mic, Monitor, Play, ScreenShare, Volume2 } from 'lucide-react'
import { useState } from 'react'

export const Route = createFileRoute('/')({
  component: Recorder,
})


function Recorder() {

  // const [cameraId, setCameraId] = useState("none")
  const [micId, setMicId] = useState<string | null>(null)
  const [speakerId, setSpeakerId] = useState<string | null>(null)
  // const [screenId, setScreenId] = useState("")

  const { cameras, microphones, speakers, screens } = useGetSources()
  const { micLevel } = useMicLevel(micId)

  const { speakerLevel } = useSpeakerLevel(!!speakerId && speakerId !== "none")

  // const {
  //   bubblePos,
  //   cameraStream,
  //   dragOffset,
  //   setDragging,
  //   videoRef
  // } = useCameraBubble(cameraId)

  // const handleSelectScreen = async (id: string, displayId: string | null) => {
  //   setScreenId(id)
  //   displayId && await window.ipcRenderer.invoke("screen:setSource", displayId)
  // }

  return (
    <div className="w-full h-full flex items-end justify-center p-10 ">
      <div className='max-w-5xl drag-top-bar h-auto w-full bg-background border sahdow rounded-xl overflow-hidden'>
        <div className='flex items-center justify-between w-full border-b bg-muted p-2 border-border/50'>
          <div>
            <Button size="icon" variant="outline">
              <FolderOpen />
            </Button>
          </div>
          <div className='flex items-center justify-center gap-4 text-foreground/70'>
            <img src="./logo.svg" className='h-7' />
            <h1>Kira Eye</h1>
          </div>
          <Button size="icon-xs" variant="ghost" >
            <XMarkIcon className="size-4 text-foreground/60" />
          </Button>
        </div>
        <div className='p-4'>
          <h1 className='mb-3 text-sm font-light text-foreground/60'>
            Please select your recording configuration
          </h1>
          <div className='grid grid-cols-5'>
            <div className='col-span-2 flex items-center justify-center gap-2'>
              <div className='hover:cursor-pointer w-full flex-1 h-full bg-muted rounded-xl overflow-hidden relative'>
                <div className='absolute h-20 top-3.5 right-3.5 w-[calc(100%-1.75rem)] bg-foreground/10 border border-foreground border-dashed backdrop-blur rounded overflow-hidden '>

                </div>
                <img src='/images/mesh-325.png' className=' w-full h-[calc(100%)-2.5rem] object-cover' />
                <div className='px-2 py-1.5 font-light text-foreground/90 h-10 flex items-center'>
                  Full screen
                </div>
              </div>
              <div className='hover:cursor-pointer w-full flex-1 h-full bg-muted rounded-xl overflow-hidden relative'>
                <div className='absolute h-20 top-3.5 right-3.5 w-[calc(100%-1.75rem)] bg-foreground/50 backdrop-blur rounded-md overflow-hidden '>
                  <div className='h-6 border-b w-full bg-foreground/10 backdrop-blur flex items-center justify-start gap-1 px-2'>
                    <div className='bg-foreground backdrop-blur h-2.5 w-2.5 rounded-full' />
                    <div className='bg-foreground backdrop-blur h-2.5 w-2.5 rounded-full' />
                    <div className='bg-foreground backdrop-blur h-2.5 w-2.5 rounded-full' />
                  </div>
                </div>
                <img src='/images/mesh-325.png' className=' w-full h-[calc(100%)-2.5rem] object-cover' />
                <div className='px-2 py-1.5 font-light text-foreground/90 h-10 flex items-center'>
                  Window
                </div>
              </div>
            </div>
            <div className='mx-2 border-x col-span-2 px-2 space-y-2'>
              <h1 className='mb-3 text-sm font-light text-foreground/60'>
                Device setup
              </h1>
              <div className='w-full flex items-center justify-center gap-2 '>
                <Button variant="outline" size="icon" className='relative overflow-'>
                  <Monitor className='absolute' />
                </Button>
                <div className='flex-1 min-w-0'>
                  <Select value={micId || ""} onValueChange={setMicId}>
                    <SelectTrigger className='w-full'>
                      <SelectValue placeholder="Choose screen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={"none"}>None</SelectItem>
                      {microphones.map((m) => (
                        <SelectItem key={m.deviceId} value={m.deviceId}>
                          {m.label || "Screen"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className='w-full flex items-center justify-center gap-2 '>

                <Button variant="outline" size="icon" className='relative overflow-'>
                  <div style={{ height: `${micLevel * 100}%` }} className='absolute  w-full bg-linear-to-t from-primary to-secondary bottom-0 ease-in-out blur' />
                  <Mic className='absolute' />
                </Button>
                <div className='flex-1 min-w-0'>
                  <Select value={micId || ""} onValueChange={setMicId}>
                    <SelectTrigger className='w-full'>
                      <SelectValue placeholder="Choose microphone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={"none"}>None</SelectItem>
                      {microphones.map((m) => (
                        <SelectItem key={m.deviceId} value={m.deviceId}>
                          {m.label || "Microphone"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className='w-full flex items-center justify-center gap-2 '>
                <Button variant="outline" size="icon" className='relative overflow-'>
                  <div style={{ height: `${speakerLevel * 100}%` }} className='absolute  w-full bg-linear-to-t from-primary to-secondary bottom-0 ease-in-out blur' />
                  <Volume2 className='absolute' />
                </Button>
                <div className='flex-1 min-w-0'>
                  <Select value={speakerId || ""} onValueChange={setSpeakerId}>
                    <SelectTrigger className='w-full'>
                      <SelectValue placeholder="Choose speaker" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={"none"}>None</SelectItem>
                      {speakers.map((m) => (
                        <SelectItem key={m.deviceId} value={m.deviceId}>
                          {m.label || "Speaker"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div className='flex flex-col items-center justify-center relative '>
              <Button size="icon-lg" className='h-18 w-18 rounded-full z-10 font-bold relative'>
                <div style={{ height: `100%` }} className='rounded-full absolute  w-full bg-linear-to-t from-primary to-secondary bottom-0 ease-in-out blur opacity-40 scale-110' />
                <div className='absolute font-bold flex items-center justify-center gap-1'>
                  <div className='h-2 w-2 bg-secondary rounded-full animate-pulse' />
                  REC
                </div>
              </Button>
              <img src="./wings.svg" className='absolute -translate-y-7' />
              <img src="./wings.svg" className='absolute -translate-y-7 blur-xl' />
            </div>
          </div>
        </div>
      </div>

      {/* {cameraStream && (
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

      <div className="p-6 max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-semibold">Recording Settings</h1>

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
                <SelectItem value={"none"}>"none"</SelectItem>

                {cameras.map((c) => (
                  <SelectItem key={c.deviceId} value={c.deviceId}>
                    {c.label || "Camera"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

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

            
          </CardContent>
        </Card>

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
                <SelectItem value={"none"}>"none"</SelectItem>

                {speakers.map((s) => (
                  <SelectItem key={s.deviceId} value={s.deviceId}>
                    {s.label || "Speaker"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

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

              <TabsContent value="screen" className="mt-4">
                <Label>Select screen</Label>

                <div className="grid grid-cols-2 gap-3">
                  {screens
                    .filter((s) => s.id.startsWith("screen"))
                    .map((s) => (
                      <button
                        key={s.id}
                        onClick={() => handleSelectScreen(s.id, s.display_id)}
                        className={`border rounded-lg p-2 hover:bg-muted transition ${screenId === s.id ? "border-primary" : ""
                          }`}
                      >
                        <img src={s.thumbnail} className="w-full rounded-md mb-2" />
                        <p className="text-xs truncate">{s.name}</p>
                      </button>
                    ))}
                </div>
              </TabsContent>

              <TabsContent value="window" className="mt-4">
                <div className="grid grid-cols-2 gap-3">
                  {screens
                    .filter((s) => s.id.startsWith("window"))
                    .map((s) => (
                      <button
                        key={s.id}
                        onClick={() => handleSelectScreen(s.id, s.display_id)}
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
      </div> */}
    </div >
  )
}

