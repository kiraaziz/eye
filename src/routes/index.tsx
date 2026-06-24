import { createFileRoute } from '@tanstack/react-router'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useGetSources } from "@/hooks/record/useGetSources"
import { useMicLevel } from "@/hooks/record/useMicLevel"
import { useSpeakerLevel } from "@/hooks/record/useSpeakerLevel"
import { useCameraBubble } from "@/hooks/record/useCameraBubble"
import { MinusIcon, XMarkIcon } from '@heroicons/react/24/solid'
import { Button } from '@/components/ui/button'
import { Camera, Check, FolderOpen, Mic, Monitor, Volume2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { motion } from "framer-motion"
import Loader from '@/components/global/Loader'

export const Route = createFileRoute('/')({
  component: Recorder,
})


function Recorder() {

  const constraintsRef = useRef(null)
  const { cameras, microphones, speakers, screens, loading } = useGetSources()

  const [open, setOpen] = useState(false)
  const [cameraId, setCameraId] = useState(null)
  const [micId, setMicId] = useState<string | null>(null)
  const [speakerId, setSpeakerId] = useState<string | null>(null)
  const [screenId, setScreenId] = useState<string | null>(null)

  const { micLevel } = useMicLevel(micId)

  const { speakerLevel } = useSpeakerLevel(!!speakerId && speakerId !== "none")
  const [captureMode, setCaptureMode] = useState<any>("screen")

  const filteredScreens = screens.filter((s) => {
    if (captureMode === "screen") return s.id.startsWith("screen")
    if (captureMode === "window") return s.id.startsWith("window")
    return true
  })

  const { cameraStream, videoRef } = useCameraBubble(cameraId)

  const handleSelectScreen = async (id: string, displayId: string | null) => {
    setScreenId(id)
    displayId && await window.ipcRenderer.invoke("screen:setSource", displayId)
    setOpen(false)
  }


  useEffect(() => {
    if (loading) return

    if (!cameraId && cameras.length > 0) {
      setCameraId((cameras as any)[0].deviceId)
    }

    if (!micId && microphones.length > 0) {
      setMicId(microphones[0].deviceId)
    }

    if (!speakerId && speakers.length > 0) {
      setSpeakerId(speakers[0].deviceId)
    }

    if (!screenId && screens.length > 0) {
      handleSelectScreen(screens[0].id, screens[0].displayId)
    }
  }, [loading, cameras, microphones, speakers, screens])

  return (
    <div className="w-full h-full bg-background/50 flex items-end justify-center p-20 border-dashed border-2 relative overflow-hidden">
      <div
        ref={constraintsRef}
        className="absolute inset-5"
      />
      {!loading && cameraStream && (
        <motion.div
          drag
          dragTransition={{
            power: 0.3,
            timeConstant: 200,
            bounceStiffness: 300,
            bounceDamping: 30
          }}
          dragElastic={0.08}
          initial={{ top: 20, left: 20 }}
          dragConstraints={constraintsRef}
          className=" fixed z-50 w-48 h-36 rounded-xl overflow-hidden shadow-xl border bg-black cursor-grab active:cursor-grabbing select-none"
        >
          <video
            autoPlay
            muted
            ref={videoRef}
            className="w-full h-full object-cover"
          />
        </motion.div>
      )}
      {loading ? <Loader /> : <motion.div
        drag
        dragTransition={{
          power: 0.3,
          timeConstant: 200,
          bounceStiffness: 300,
          bounceDamping: 30
        }}
        dragElastic={0.08}
        dragConstraints={constraintsRef}
        className='z-10 max-w-5xl drag-top-bar h-auto w-full bg-background border sahdow rounded-xl overflow-hidden'>
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
          <div className='flex items-center justify-center gap-2'>
            <Button
              size="icon-xs"
              variant="ghost"
              onClick={() => window.ipcRenderer.invoke("window:minimize")}
            >
              <MinusIcon className="size-5 text-foreground/60" />
            </Button>

            <Button
              size="icon-xs"
              variant="ghost"
              onClick={() => window.ipcRenderer.invoke("window:close")}
            >
              <XMarkIcon className="size-5 text-foreground/60" />
            </Button>
          </div>
        </div>
        <div className='p-4'>
          <h1 className='mb-3 text-sm font-light text-foreground/60'>
            Please select your recording configuration
          </h1>
          <div className='grid grid-cols-5'>
            <div className='col-span-2 flex items-center justify-center gap-2'>
              <button onClick={() => setCaptureMode("screen")} className={cn((captureMode === "screen" ? "border-border text-foreground!" : "border-transparent! text-foreground/60"), 'hover:cursor-pointer ease-in-out duration-100 border w-full flex-1 h-full bg-muted rounded-xl overflow-hidden relative')}>
                <div className='absolute h-20 top-3.5 right-3.5 w-[calc(100%-1.75rem)] bg-foreground/10 border border-foreground border-dashed backdrop-blur rounded overflow-hidden '>

                </div>
                <img src='/images/mesh-325.png' className=' w-full h-[calc(100%)-2.5rem] object-cover' />
                <div className='px-2 py-1.5 font-light h-10 flex items-center'>
                  <div className={cn((captureMode === "screen") ? "w-4" : "w-0 overflow-hidden", 'ease-in-out duration-200 h-4  bg-primary text-primary-foreground flex items-center justify-center rounded-full mr-2')}>
                    <Check size={13} />
                  </div>
                  Full screen
                </div>
              </button>
              <button onClick={() => setCaptureMode("window")} className={cn((captureMode === "window" ? "border-border   text-foreground!" : "border-transparent! text-foreground/60"), 'hover:cursor-pointer ease-in-out duration-100 border w-full flex-1 h-full bg-muted rounded-xl overflow-hidden relative')}>
                <div className='absolute h-20 top-3.5 right-3.5 w-[calc(100%-1.75rem)] bg-foreground/50 backdrop-blur rounded-md overflow-hidden '>
                  <div className='h-6 border-b w-full bg-foreground/10 backdrop-blur flex items-center justify-start gap-1 px-2'>
                    <div className='bg-foreground backdrop-blur h-2.5 w-2.5 rounded-full' />
                    <div className='bg-foreground backdrop-blur h-2.5 w-2.5 rounded-full' />
                    <div className='bg-foreground backdrop-blur h-2.5 w-2.5 rounded-full' />
                  </div>
                </div>
                <img src='/images/mesh-325.png' className=' w-full h-[calc(100%)-2.5rem] object-cover' />
                <div className='px-2 py-1.5 font-light  h-10 flex items-center'>
                  <div className={cn((captureMode === "window") ? "w-4" : "w-0 overflow-hidden", 'ease-in-out duration-200 h-4  bg-primary text-primary-foreground flex items-center justify-center rounded-full mr-2')}>
                    <Check size={13} />
                  </div>
                  Window
                </div>
              </button>
            </div>
            <div className='mx-2 border-x col-span-2 px-2 space-y-2'>
              <div className='w-full flex items-center justify-center gap-2 '>
                <Button variant="outline" size="icon" className='relative overflow-'>
                  <Monitor className='absolute' />
                </Button>
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger className="flex-1" render={<div className='flex-1 w-full' />}>
                    <Button variant="outline" className='flex-1 justify-start w-full truncate'>
                      <p className='max-w-40'>
                        {(screenId && filteredScreens.find((s) => s.id === screenId)) ? filteredScreens.find((s) => s.id === screenId).name : "Choose screen"}
                      </p>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="grid grid-cols-2 gap-2 w-3xl!">
                    {filteredScreens.map((m) => (
                      <button className='pointer-events-auto overflow-hidden bg-muted border hover:cursor-pointer rounded-xl' onClick={() => handleSelectScreen(m.id, m.displayId)}>
                        <img src={m.thumbnail} className='w-full h-50 object-cover object-top-left' />
                        <div className='p-2 flex items-start text-start text-nowrap truncate '>
                          <div className={cn((screenId === m.id) ? "w-4" : "w-0 overflow-hidden", 'ease-in-out duration-200 h-4  bg-primary text-primary-foreground flex items-center justify-center rounded-full mr-2')}>
                            <Check size={13} />
                          </div>
                          {m.name || "Screen"}
                        </div>
                      </button>
                    ))}
                  </PopoverContent>
                </Popover>

              </div>
              <div className='w-full flex items-center justify-center gap-2 '>
                <Button variant="outline" size="icon" className='relative overflow-'>
                  <Camera className='absolute' />
                </Button>
                <div className='flex-1 min-w-0'>
                  <Select value={cameraId || ""} onValueChange={setCameraId as any}>
                    <SelectTrigger className='w-full'>
                      <SelectValue placeholder="Choose camera" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={"none"}>None</SelectItem>
                      {cameras.map((m) => (
                        <SelectItem key={m.deviceId} value={m.deviceId}>
                          {m.label}
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
      </motion.div>}
    </div >
  )
}

