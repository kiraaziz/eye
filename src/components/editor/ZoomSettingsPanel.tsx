import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { ZoomSettings } from '@/lib/editor/types'
import { ZoomIn } from 'lucide-react'

type ZoomSettingsPanelProps = {
  settings: ZoomSettings
  onChange: (settings: ZoomSettings) => void
}

export function ZoomSettingsPanel({ settings, onChange }: ZoomSettingsPanelProps) {
  const set = <K extends keyof ZoomSettings>(key: K, value: ZoomSettings[K]) => {
    onChange({ ...settings, [key]: value })
  }

  return (
    <div className="flex w-72 shrink-0 flex-col border-l border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border/50 px-4 py-3">
        <div className="flex size-8 items-center justify-center rounded-lg bg-violet-500/20 text-violet-400">
          <ZoomIn className="size-4" />
        </div>
        <div>
          <h3 className="text-sm font-medium">Zoom</h3>
          <p className="text-xs text-muted-foreground">Camera & focus</p>
        </div>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto p-4">
        <div>
          <Label className="mb-2 block text-xs text-muted-foreground">Mode</Label>
          <div className="flex rounded-lg border border-border p-0.5">
            {(['auto', 'manual'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                className={cn(
                  'flex-1 rounded-md px-3 py-1.5 text-xs capitalize transition-colors',
                  settings.mode === mode
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                onClick={() => set('mode', mode)}
              >
                {mode}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
            {settings.mode === 'auto'
              ? 'Zoomed camera will automatically try to keep the mouse cursor visible.'
              : 'Zoom stays fixed on the click position for each segment.'}
          </p>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Zoom level</Label>
            <span className="text-xs font-medium">{settings.level.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={settings.level}
            onChange={(e) => set('level', parseFloat(e.target.value))}
            className="w-full accent-violet-500"
          />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Snap to edges</Label>
            <span className="text-xs font-medium">{settings.snapToEdges}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={settings.snapToEdges}
            onChange={(e) => set('snapToEdges', parseInt(e.target.value, 10))}
            className="w-full accent-violet-500"
          />
        </div>

        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={settings.glide}
            onChange={(e) => set('glide', e.target.checked)}
            className="mt-0.5 accent-violet-500"
          />
          <div>
            <span className="text-sm">Glide</span>
            <p className="text-[11px] text-muted-foreground">
              Enable slow camera movement while zoomed in
            </p>
          </div>
        </label>
      </div>
    </div>
  )
}
