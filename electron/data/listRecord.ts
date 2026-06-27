import { RecordingResult, RecordingListItem } from "types/recording"
import { getRecordingsRoot } from "../utils/mediaProtocol"
import path from 'node:path'
import fs from 'node:fs'

export const listRecord = async (): Promise<RecordingListItem[]> => {
    const root = getRecordingsRoot()
    if (!fs.existsSync(root)) return []

    const entries = fs.readdirSync(root, { withFileTypes: true }).filter((d) => d.isDirectory())
    const items: RecordingListItem[] = []

    for (const entry of entries) {
        const manifestPath = path.join(root, entry.name, 'manifest.json')
        if (!fs.existsSync(manifestPath)) continue

        try {
            const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8')) as RecordingResult
            items.push({
                sessionId: entry.name,
                startedAt: manifest.meta.startedAt,
                durationMs: manifest.meta.durationMs,
                hasScreen: !!manifest.assets.screen,
                hasCamera: !!manifest.assets.camera,
                hasMic: !!manifest.assets.mic,
                hasSpeaker: !!manifest.assets.speaker,
                screenThumbnail: manifest.assets.screenThumbnail ?? null,
                cameraThumbnail: manifest.assets.cameraThumbnail ?? null,
            })
        } catch { }
    }

    return items.sort((a, b) => b.startedAt - a.startedAt)
}