import { RecordingAssets, RecordingConfig, RecordingMeta, RecordingResult } from "@/types/recording"
import { toEyeMediaUrl } from "../utils/mediaProtocol"
import { getDisplaysMeta } from "../screen/getDisplaysMeta"
import { sessionStartTime, stopMouseTracking } from "./mouse"
import { app } from "electron"
import path from 'node:path'
import fs from 'node:fs'

export const finalise = async (_: any, payload: {
    sessionId: string
    config: RecordingConfig
    savedPaths: Partial<RecordingAssets>
    thumbnailPaths?: Partial<Record<'camera' | 'screen', string>>
    durationMs: number
}): Promise<RecordingResult & { sessionId: string }> => {
    const { sessionId, config, savedPaths, thumbnailPaths, durationMs } = payload

    const collectedEvents = stopMouseTracking()
    const { displays, primaryDisplay } = getDisplaysMeta()

    const toUrl = (p?: string | null) => (p ? toEyeMediaUrl(p) : null)

    const assets: RecordingAssets = {
        camera: toUrl(savedPaths.camera),
        mic: toUrl(savedPaths.mic),
        speaker: toUrl(savedPaths.speaker),
        screen: toUrl(savedPaths.screen),
        cameraThumbnail: toUrl(thumbnailPaths?.camera),
        screenThumbnail: toUrl(thumbnailPaths?.screen),
    }

    const meta: RecordingMeta = { startedAt: sessionStartTime, durationMs, displays, primaryDisplay }
    const result: RecordingResult = { config, assets, meta, mouseEvents: collectedEvents }

    const sessionDir = path.join(app.getPath('userData'), 'recordings', sessionId)
    fs.mkdirSync(sessionDir, { recursive: true })
    fs.writeFileSync(path.join(sessionDir, 'manifest.json'), JSON.stringify(result, null, 2))

    return { sessionId, ...result }
}