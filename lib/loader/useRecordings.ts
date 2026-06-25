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
      await window.ipcRenderer.invoke('window:maximize')

      setRecordings(list as RecordingListItem[])
    } catch (err) {
      toast.error('Failed to load recordings')
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteRecording = useCallback(async (sessionId: string) => {
    try {
      await window.ipcRenderer.invoke('recordings:delete', sessionId)
      setRecordings((prev) => prev.filter((r) => r.sessionId !== sessionId))
      toast.success('Recording deleted')
    } catch (err) {
      toast.error('Failed to delete recording')
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { recordings, loading, refresh, deleteRecording }
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