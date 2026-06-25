import path from 'node:path'
import fs from 'node:fs'
import { getRecordingsRoot, toEyeMediaUrl } from '../utils/mediaProtocol'
import { RecordingAssets, RecordingResult } from '@/types/recording'

type TrackName = 'screen' | 'camera' | 'mic' | 'speaker'

function assetUrlForTrack(sessionDir: string, track: TrackName): string | null {
  const filePath = path.join(sessionDir, `${track}.webm`)
  return fs.existsSync(filePath) ? toEyeMediaUrl(filePath) : null
}

function resolveAssets(sessionDir: string, raw: RecordingAssets): RecordingAssets {
  return {
    screen: raw.screen ? assetUrlForTrack(sessionDir, 'screen') : null,
    camera: raw.camera ? assetUrlForTrack(sessionDir, 'camera') : null,
    mic: raw.mic ? assetUrlForTrack(sessionDir, 'mic') : null,
    speaker: raw.speaker ? assetUrlForTrack(sessionDir, 'speaker') : null,
  }
}


export const loadRecord = async (_: any, sessionId: string) => {
    const sessionDir = path.join(getRecordingsRoot(), sessionId)
    const manifestPath = path.join(sessionDir, 'manifest.json')

    if (!fs.existsSync(manifestPath)) {
        throw new Error(`Recording not found: ${sessionId}`)
    }

    const raw = JSON.parse(fs.readFileSync(manifestPath, 'utf-8')) as RecordingResult
    const assets = resolveAssets(sessionDir, raw.assets)

    return { sessionId, ...raw, assets } satisfies RecordingResult & { sessionId: string }
}