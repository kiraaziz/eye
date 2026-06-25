import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import Loader from '@/components/global/Loader'
import { cn } from '@/lib/utils'
import {
  Camera,
  CirclePlus,
  Clock,
  Film,
  Mic,
  Volume2,
} from 'lucide-react' 
import { useRecordingsList } from '@/lib/loader/useRecordings'

export const Route = createFileRoute('/e/')({
  component: Library,
})

function formatDate(ts: number): string {
  return new Date(ts).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function formatDuration(ms: number): string {
  const s = Math.round(ms / 1000)
  const m = Math.floor(s / 60)
  const rem = s % 60
  return m > 0 ? `${m}m ${rem}s` : `${rem}s`
}

function Library() {
  const { recordings, loading } = useRecordingsList()

  return (
    <div className="h-full">

      <main className="flex-1 overflow-y-auto p-6">
        {loading && (
          <div className="flex h-64 items-center justify-center">
            <Loader />
          </div>
        )}
        {!loading && recordings.length === 0 && (
          <div className="flex h-64 flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border bg-muted/20">
            <Film className="size-10 text-muted-foreground" />
            <div className="text-center">
              <p className="font-medium">No recordings yet</p>
              <p className="text-sm text-muted-foreground">
                Start your first screen recording
              </p>
            </div>
            <Link to="/">
              <Button>
                <CirclePlus className="size-4" />
                New recording
              </Button>
            </Link>
          </div>
        )}

        {!loading && recordings.length > 0 && (
          <div className="grid gap-3">
            {recordings.map((item) => (
              <Link
                key={item.sessionId}
                to="/editor/$sessionId"
                params={{ sessionId: item.sessionId }}
                className="block"
              >
                <article
                  className={cn(
                    'flex items-center justify-between rounded-xl border border-border bg-card p-4',
                    'transition-colors hover:border-primary/40 hover:bg-muted/30'
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Film className="size-5" />
                    </div>
                    <div>
                      <p className="font-medium">{formatDate(item.startedAt)}</p>
                      <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="size-3" />
                          {formatDuration(item.durationMs)}
                        </span>
                        {item.hasScreen && <Film className="size-3" />}
                        {item.hasCamera && <Camera className="size-3" />}
                        {item.hasMic && <Mic className="size-3" />}
                        {item.hasSpeaker && <Volume2 className="size-3" />}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">Edit</span>
                </article>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
