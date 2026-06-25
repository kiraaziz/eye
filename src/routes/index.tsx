import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useGetSources } from '@/lib/configs/useGetSources'
import { useMicLevel } from '@/lib/configs/useMicLevel'
import { useSpeakerLevel } from '@/lib/configs/useSpeakerLevel'
import { useCameraBubble } from '@/lib/configs/useCameraBubble'
import { MinusIcon, XMarkIcon } from '@heroicons/react/24/solid'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Camera, Check, Mic, Monitor, Volume2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { motion } from 'framer-motion'
import Loader from '@/components/global/Loader'
import { useStartRecording } from '@/lib/stream/useStartRecording'

export const Route = createFileRoute("/")({
  component: NewRecording,
})

function NewRecording() { 
  const constraintsRef = useRef(null)
  const { cameras, microphones, speakers, screens, loading } = useGetSources()

  const [open, setOpen] = useState(false)
  const [cameraId, setCameraId] = useState(null)
  const [micId, setMicId] = useState<string | null>(null)
  const [speakerId, setSpeakerId] = useState<string | null>(null)
  const [screenId, setScreenId] = useState<string | null>(null)

  const { micLevel } = useMicLevel(micId)
  const { speakerLevel } = useSpeakerLevel(!!speakerId && speakerId !== 'none')
  const [captureMode, setCaptureMode] = useState<any>('screen')

  const filteredScreens = screens.filter((s) => {
    if (captureMode === 'screen') return s.id.startsWith('screen')
    if (captureMode === 'window') return s.id.startsWith('window')
    return true
  })

  const { cameraStream, videoRef } = useCameraBubble(cameraId)

  const handleSelectScreen = async (id: string, displayId: string | null) => {
    setScreenId(id)
    displayId && (await window.ipcRenderer.invoke('screen:setSource', displayId))
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

  const { start, isRecording } = useStartRecording({
    cameraId,
    micId,
    speakerId,
    screenId,
  })

  const stopFnRef = useRef<(() => Promise<void>) | null>(null)

  const handleRec = async () => {
    if (isRecording) {
      await stopFnRef.current?.()
    } else {
      stopFnRef.current = (await start()) ?? null
    }
  }

  return (
    <div
      className="relative flex h-full w-full cursor-pointer items-end justify-center overflow-hidden border-2 border-dashed bg-background/50 p-20"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          window.ipcRenderer.invoke('window:minimize')
        }
      }}
    >
      <div ref={constraintsRef} className="pointer-events-none absolute inset-5" />
      {!loading && cameraStream && (
        <motion.div
          drag
          dragTransition={{
            power: 0.3,
            timeConstant: 200,
            bounceStiffness: 300,
            bounceDamping: 30,
          }}
          dragElastic={0.08}
          initial={{ top: 20, left: 20 }}
          dragConstraints={constraintsRef}
          className="fixed z-50 h-36 w-48 cursor-grab select-none overflow-hidden rounded-xl border bg-black shadow-xl active:cursor-grabbing"
        >
          <video autoPlay muted ref={videoRef} className="h-full w-full object-cover" />
        </motion.div>
      )}
      {loading ? (
        <Loader />
      ) : (
        <motion.div
          drag
          dragTransition={{
            power: 0.3,
            timeConstant: 200,
            bounceStiffness: 300,
            bounceDamping: 30,
          }}
          dragElastic={0.08}
          dragConstraints={constraintsRef}
          onClick={(e) => e.stopPropagation()}
          className="drag-top-bar z-10 h-auto w-full max-w-5xl cursor-default overflow-hidden rounded-xl border bg-background sahdow"
        >
          <div className="flex w-full items-center justify-between border-b border-border/50 bg-muted p-2">
            <div>
              <Link to="/">
                <Button size="icon" variant="outline">
                  <ArrowLeft className="size-4" />
                </Button>
              </Link>
            </div>
            <div className="flex items-center justify-center gap-4 text-foreground/70">
              <img src="./logo.svg" className="h-7" />
              <h1>Kira Eye</h1>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Button
                size="icon-xs"
                variant="ghost"
                onClick={() => window.ipcRenderer.invoke('window:minimize')}
              >
                <MinusIcon className="size-5 text-foreground/60" />
              </Button>
              <Button
                size="icon-xs"
                variant="ghost"
                onClick={() => window.ipcRenderer.invoke('window:close')}
              >
                <XMarkIcon className="size-5 text-foreground/60" />
              </Button>
            </div>
          </div>
          <div className="p-4">
            <h1 className="mb-3 text-sm font-light text-foreground/60">
              Please select your recording configuration
            </h1>
            <div className="grid grid-cols-5">
              <div className="col-span-2 flex items-center justify-center gap-2">
                <button
                  onClick={() => setCaptureMode('screen')}
                  className={cn(
                    captureMode === 'screen'
                      ? 'border-border text-foreground!'
                      : 'border-transparent! text-foreground/60',
                    'relative h-full w-full flex-1 overflow-hidden rounded-xl border bg-muted duration-100 ease-in-out hover:cursor-pointer'
                  )}
                >
                  <div className="absolute top-3.5 right-3.5 h-20 w-[calc(100%-1.75rem)] overflow-hidden rounded border border-dashed border-foreground bg-foreground/10 backdrop-blur" />
                  <img src="/images/mesh-325.png" className="h-[calc(100%)-2.5rem] w-full object-cover" />
                  <div className="flex h-10 items-center px-2 py-1.5 font-light">
                    <div
                      className={cn(
                        captureMode === 'screen' ? 'w-4' : 'w-0 overflow-hidden',
                        'mr-2 flex h-4 items-center justify-center rounded-full bg-primary text-primary-foreground duration-200 ease-in-out'
                      )}
                    >
                      <Check size={13} />
                    </div>
                    Full screen
                  </div>
                </button>
                <button
                  onClick={() => setCaptureMode('window')}
                  className={cn(
                    captureMode === 'window'
                      ? 'border-border text-foreground!'
                      : 'border-transparent! text-foreground/60',
                    'relative h-full w-full flex-1 overflow-hidden rounded-xl border bg-muted duration-100 ease-in-out hover:cursor-pointer'
                  )}
                >
                  <div className="absolute top-3.5 right-3.5 h-20 w-[calc(100%-1.75rem)] overflow-hidden rounded-md bg-foreground/50 backdrop-blur">
                    <div className="flex h-6 w-full items-center justify-start gap-1 border-b bg-foreground/10 px-2 backdrop-blur">
                      <div className="h-2.5 w-2.5 rounded-full bg-foreground backdrop-blur" />
                      <div className="h-2.5 w-2.5 rounded-full bg-foreground backdrop-blur" />
                      <div className="h-2.5 w-2.5 rounded-full bg-foreground backdrop-blur" />
                    </div>
                  </div>
                  <img src="/images/mesh-325.png" className="h-[calc(100%)-2.5rem] w-full object-cover" />
                  <div className="flex h-10 items-center px-2 py-1.5 font-light">
                    <div
                      className={cn(
                        captureMode === 'window' ? 'w-4' : 'w-0 overflow-hidden',
                        'mr-2 flex h-4 items-center justify-center rounded-full bg-primary text-primary-foreground duration-200 ease-in-out'
                      )}
                    >
                      <Check size={13} />
                    </div>
                    Window
                  </div>
                </button>
              </div>
              <div className="col-span-2 mx-2 space-y-2 border-x px-2">
                <div className="flex w-full items-center justify-center gap-2">
                  <Button variant="outline" size="icon" className="relative overflow-">
                    <Monitor className="absolute" />
                  </Button>
                  <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger className="flex-1" render={<div className="w-full flex-1" />}>
                      <Button variant="outline" className="w-full flex-1 justify-start truncate">
                        <p className="max-w-40">
                          {screenId && filteredScreens.find((s) => s.id === screenId)
                            ? filteredScreens.find((s) => s.id === screenId)!.name
                            : 'Choose screen'}
                        </p>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="grid w-3xl! grid-cols-2 gap-2">
                      {filteredScreens.map((m) => (
                        <button
                          key={m.id}
                          className="pointer-events-auto overflow-hidden rounded-xl border bg-muted hover:cursor-pointer"
                          onClick={() => handleSelectScreen(m.id, m.displayId)}
                        >
                          <img src={m.thumbnail} className="h-50 w-full object-cover object-top-left" />
                          <div className="flex items-start truncate p-2 text-nowrap">
                            <div
                              className={cn(
                                screenId === m.id ? 'w-4' : 'w-0 overflow-hidden',
                                'mr-2 flex h-4 items-center justify-center rounded-full bg-primary text-primary-foreground duration-200 ease-in-out'
                              )}
                            >
                              <Check size={13} />
                            </div>
                            {m.name || 'Screen'}
                          </div>
                        </button>
                      ))}
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex w-full items-center justify-center gap-2">
                  <Button variant="outline" size="icon" className="relative overflow-">
                    <Camera className="absolute" />
                  </Button>
                  <div className="min-w-0 flex-1">
                    <Select value={cameraId || ''} onValueChange={setCameraId as any}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Choose camera" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {cameras.map((m) => (
                          <SelectItem key={m.deviceId} value={m.deviceId}>
                            {m.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex w-full items-center justify-center gap-2">
                  <Button variant="outline" size="icon" className="relative overflow-">
                    <div
                      style={{ height: `${micLevel * 100}%` }}
                      className="absolute bottom-0 w-full bg-linear-to-t from-primary to-secondary blur ease-in-out"
                    />
                    <Mic className="absolute" />
                  </Button>
                  <div className="min-w-0 flex-1">
                    <Select value={micId || ''} onValueChange={setMicId}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Choose microphone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {microphones.map((m) => (
                          <SelectItem key={m.deviceId} value={m.deviceId}>
                            {m.label || 'Microphone'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex w-full items-center justify-center gap-2">
                  <Button variant="outline" size="icon" className="relative overflow-">
                    <div
                      style={{ height: `${speakerLevel * 100}%` }}
                      className="absolute bottom-0 w-full bg-linear-to-t from-primary to-secondary blur ease-in-out"
                    />
                    <Volume2 className="absolute" />
                  </Button>
                  <div className="min-w-0 flex-1">
                    <Select value={speakerId || ''} onValueChange={setSpeakerId}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Choose speaker" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {speakers.map((m) => (
                          <SelectItem key={m.deviceId} value={m.deviceId}>
                            {m.label || 'Speaker'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <div className="relative flex flex-col items-center justify-center">
                <Button
                  onClick={handleRec}
                  size="icon-lg"
                  className="relative z-10 h-18 w-18 rounded-full font-bold"
                >
                  <div className="absolute bottom-0 w-full scale-110 rounded-full bg-linear-to-t from-primary to-secondary opacity-40 blur ease-in-out" style={{ height: '100%' }} />
                  <div className="absolute flex items-center justify-center gap-1 font-bold">
                    <div className="h-2 w-2 animate-pulse rounded-full bg-secondary" />
                    REC
                  </div>
                </Button>
                <img src="./wings.svg" className="absolute -translate-y-7" />
                <img src="./wings.svg" className="absolute -translate-y-7 blur-xl" />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
