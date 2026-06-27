import type { RecordingResult } from '@/lib/types/recording'

/** Display that was captured for the screen track */
export function getRecordedDisplay(data: RecordingResult) {
  const { displays } = data.meta
  if (displays.length === 1) return displays[0]
  const nonPrimary = displays.find((d) => !d.isPrimary)
  return nonPrimary ?? data.meta.primaryDisplay
}
