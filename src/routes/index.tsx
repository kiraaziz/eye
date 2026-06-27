import { createFileRoute } from '@tanstack/react-router'
import { useRef, useState } from 'react'
import Loader from '@/components/global/Loader' 
import CountdownOverlay from '@/components/recorder/CountdownOverlay'
import CameraBubble from '@/components/recorder/CameraBubble'
import Overlay from '@/components/recorder/Overlay'
import ConfigPannel from '@/components/recorder/ConfigPannel'
import { Button } from '@/components/ui/button'
import { RecordingConfig } from 'types/recording'
import { getSources } from '@/lib/panel/getSources'
import { startRecording } from '@/lib/panel/startRecording'

export const Route = createFileRoute("/")({
  component: NewRecording,
})

function NewRecording() {

  const [countdown, setCountdown] = useState(false)
  const [captureMode, setCaptureMode] = useState<any>('screen')

  const [config, setConfig] = useState<RecordingConfig>({
    cameraId: null,
    micId: null,
    speakerId: null,
    screenId: null,
    quality: 'high',
  })

  const updateConfig = (patch: Partial<RecordingConfig>) =>
    setConfig((prev) => ({ ...prev, ...patch }))

  const sources = getSources()
  const { start, isRecording } = startRecording(config)

  const stopFnRef = useRef<(() => Promise<void>) | null>(null)
  const handleRec = async () => {
    if (isRecording) {
      await stopFnRef.current?.()
    } else {
      stopFnRef.current = (await start()) ?? null
    }
  }

  if (sources.loading) return <Loader />

  return (
    <div className="relative flex h-full w-full items-end justify-center overflow-hidden p-20" >
      <Overlay showFrame={!isRecording && captureMode === "screen"} />
      <CameraBubble cameraId={config.cameraId} />
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
          ...sources,
          setCountdown,
          config, updateConfig,
          captureMode, setCaptureMode,
        }}
      />}
    </div>
  )
}