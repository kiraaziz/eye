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

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    window.ipcRenderer
      .invoke('recordings:load', sessionId)
      .then((data) => {
        if (!cancelled) setRecording(data as SavedRecording)
      })
      .catch(() => {
        if (!cancelled) {
          toast.error('Failed to load recording')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [sessionId])

  return { recording, loading }
}
