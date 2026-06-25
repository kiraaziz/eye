import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import type { RecordingListItem, SavedRecording } from '@/types/recording'

export function useRecordingsList() {
  const [recordings, setRecordings] = useState<RecordingListItem[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const list = await window.ipcRenderer.invoke('recordings:list')
      await window.ipcRenderer.invoke("window:toggleMode", "normal")

      setRecordings(list as RecordingListItem[])
    } catch (err) {
      toast.error('Failed to load recordings')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { recordings, loading, refresh }
}

export function useRecording(sessionId: string) {
  const [recording, setRecording] = useState<SavedRecording | null>(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)

    try {
      const data = await window.ipcRenderer.invoke('recordings:load', sessionId)

      await window.ipcRenderer.invoke("window:toggleMode", "normal")
      setRecording(data as SavedRecording)

    } catch (err) {
      toast.error('Failed to load recording')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [sessionId])

  return { recording, loading }
}