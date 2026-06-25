import type { RecordingAssets, RecordingResult } from '@/lib/types/recording'

const EYE_MEDIA_PREFIX = 'eye-media://'

/** Parse file:// or raw Windows paths into a filesystem path */
export function fileUrlToPath(fileUrl: string): string {
  let p = fileUrl.trim()

  if (p.startsWith('file://')) {
    p = p.slice('file://'.length)
  }

  // file:///C:/Users/... → C:/Users/...
  if (p.startsWith('/') && /^\/[A-Za-z]:/.test(p)) {
    p = p.slice(1)
  }

  return decodeURIComponent(p)
}

export function toEyeMediaUrlFromAny(url: string | null): string | null {
  if (!url) return null
  if (url.startsWith(EYE_MEDIA_PREFIX)) return url

  const filePath = fileUrlToPath(url)
  return `${EYE_MEDIA_PREFIX}local/?path=${encodeURIComponent(filePath)}`
}

export function normalizeRecordingAssets(assets: RecordingAssets): RecordingAssets {
  return {
    camera: toEyeMediaUrlFromAny(assets.camera),
    mic: toEyeMediaUrlFromAny(assets.mic),
    speaker: toEyeMediaUrlFromAny(assets.speaker),
    screen: toEyeMediaUrlFromAny(assets.screen),
  }
}

export function normalizeRecordingResult(data: RecordingResult): RecordingResult {
  return {
    ...data,
    assets: normalizeRecordingAssets(data.assets),
  }
}
