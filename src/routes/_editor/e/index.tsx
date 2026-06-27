import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import Loader from '@/components/global/Loader'
import {
  CirclePlus,
  Clock,
  Film,
  Trash2,
} from 'lucide-react'
import { useRecordingsList } from '@/lib/data/records'
import { RecordingListItem } from 'types/recording'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export const Route = createFileRoute('/_editor/e/')({
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
  const { recordings, loading, deleteRecording } = useRecordingsList()
  const [pendingDelete, setPendingDelete] = useState<RecordingListItem | null>(null)
  const [deleting, setDeleting] = useState(false)

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return
    setDeleting(true)
    await deleteRecording(pendingDelete.sessionId)
    setDeleting(false)
    setPendingDelete(null)
  }





  if (loading) return <Loader />

  return (
    <div className="h-full relative z-10">
      {recordings.length === 0 && (
        <div className="flex h-full flex-col items-center justify-center gap-4">
          <img src="./logo.svg" className="h-20" />
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

      {recordings.length > 0 && (
        <div className="grid gap-4 p-4 sm:p-6 lg:p-14 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <div className='col-span-full flex items-center justify-end'>
            <Link to="/">
              <Button>
                <CirclePlus className="size-4" />
                New recording
              </Button>
            </Link>
          </div>
          {recordings.map((item) => (
            <Link
              key={item.sessionId}
              to="/e/$sessionId"
              params={{ sessionId: item.sessionId }}
              className="overflow-hidden rounded-xl relative bg-background/30 hover:bg-background! backdrop-blur-2xl border border-input/40 group"
            >
              <div className='w-full h-60 absolute top-0 left-0 z-1 flex items-center justify-center bg-background/40 backdrop-blur-xs opacity-0 ease-in-out duration-500 group-hover:opacity-100'>
                <img src='/svg/wings.svg' className='h-35 -translate-y-5' />
                <h1 className='absolute font-medium translate-y-4'>OPEN</h1>
              </div>
              <Avatar className='w-full h-60 object-cover object-top-left rounded-none'>
                <AvatarImage src={item.screenThumbnail || ""} className='rounded-none object-cover group-hover:scale-110 ease-in-out duration-300' />
                <AvatarFallback className='rounded-none'>
                  <Film className="size-10" />
                </AvatarFallback>
              </Avatar>
              {item.cameraThumbnail && <Avatar className='w-20 h-20 object-cover object-top-left rounded-md absolute top-35 right-5 shadow-2xl'>
                <AvatarImage src={item.cameraThumbnail || ""} className='rounded-none object-cover' />
                <AvatarFallback className='rounded-none'>
                  <Film className="size-10" />
                </AvatarFallback>
              </Avatar>}
              <div className='bortder-b w-full' />
              <div className='flex items-center justify-between p-4'>
                <div className="flex items-center gap-4">
                  <img src="./logo.svg" className="h-7" />
                  <div>
                    <p className="font-medium">{formatDate(item.startedAt)}</p>
                    <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="size-3" />
                        {formatDuration(item.durationMs)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setPendingDelete(item)
                    }}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <AlertDialog
        open={!!pendingDelete}
        onOpenChange={(open) => !open && !deleting && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete recording?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete &&
                `This will permanently delete the recording from ${formatDate(
                  pendingDelete.startedAt
                )}. This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleting}
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}


