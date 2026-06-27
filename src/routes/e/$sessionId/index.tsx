import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Editor } from '@/components/editor/Editor'
import Loader from '@/components/global/Loader'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { RecordingResult } from '@/../types/recording'
import { useRecording } from '@/lib/loader/useRecordings'

export const Route = createFileRoute('/e/$sessionId/')({
  component: EditorPage,
})

function EditorPage() {
  const { sessionId } = Route.useParams()
  const { recording, loading } = useRecording(sessionId)
  const [data, setData] = useState<RecordingResult | null>(null)

  useEffect(() => {
    if (recording) setData(recording)
  }, [recording])

  if (loading || (recording && !data)) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader />
      </div>
    )
  }

  if (!recording) {
    return (
      <div className="flex h-screen flex-col bg-background">
        <header className="flex items-center gap-3 border-b border-border px-4 py-3">
          <Link to="/">
            <Button size="icon-sm" variant="ghost">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <h1 className="text-sm font-medium">Editor</h1>
        </header>
      </div>
    )
  }

  return <Editor data={data} setData={setData} />
}
