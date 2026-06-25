import { createFileRoute } from '@tanstack/react-router'
import { useGetSources } from '@/lib/configs/useGetSources'
import { useRef, useState } from 'react'
import Loader from '@/components/global/Loader'
import { useStartRecording } from '@/lib/stream/useStartRecording'
import { QualityPreset } from '@/lib/configs/qualityPresets'
import CountdownOverlay from '@/components/recorder/CountdownOverlay'
import CameraBubble from '@/components/recorder/CameraBubble'
import Overlay from '@/components/recorder/Overlay'
import ConfigPannel from '@/components/recorder/ConfigPannel'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute("/")({
  component: NewRecording,
})

function NewRecording() {

  const { cameras, microphones, speakers, screens, loading } = useGetSources()

  const [countdown, setCountdown] = useState(false)

  const [cameraId, setCameraId] = useState(null)
  const [micId, setMicId] = useState<string | null>(null)
  const [speakerId, setSpeakerId] = useState<string | null>(null)
  const [screenId, setScreenId] = useState<string | null>(null)
  const [quality, setQuality] = useState<QualityPreset>('high')

  const [captureMode, setCaptureMode] = useState<any>('screen')


  const { start, isRecording } = useStartRecording({
    cameraId,
    micId,
    speakerId,
    screenId,
    quality
  })

  const stopFnRef = useRef<(() => Promise<void>) | null>(null)

  const handleRec = async () => {
    if (isRecording) {
      await stopFnRef.current?.()
    } else {
      stopFnRef.current = (await start()) ?? null
    }
  }

  if (loading) return <Loader />

  return (
    <div className="relative flex h-full w-full items-end justify-center overflow-hidden p-20" >
      <Overlay showFrame={!isRecording && captureMode === "screen"} />
      <CameraBubble cameraId={cameraId} />
      {countdown && <CountdownOverlay
        start={countdown}
        onComplete={() => {
          setCountdown(false)
          handleRec()
        }}
      />}

      {!countdown && isRecording && <Button className='absolute' onClick={handleRec}>
        Stop
      </Button>}
      {!countdown && !isRecording && <ConfigPannel
        {...{
          cameras, microphones, speakers, screens, loading,
          setCountdown,
          cameraId, setCameraId,
          micId, setMicId,
          speakerId, setSpeakerId,
          screenId, setScreenId,
          captureMode, setCaptureMode,
          quality, setQuality,
        }}
      />}
    </div>
  )
}
