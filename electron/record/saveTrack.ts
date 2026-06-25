import { app } from "electron"
import path from 'node:path'
import fs from 'node:fs'

export const saveTrack = async (_: any, payload: {
    type: 'camera' | 'mic' | 'speaker' | 'screen'
    buffer: ArrayBuffer
    sessionId: string
    ext?: string
}): Promise<{ filePath: string }> => {

    const { type, buffer, sessionId, ext = 'webm' } = payload

    const sessionDir = path.join(app.getPath('userData'), 'recordings', sessionId)
    fs.mkdirSync(sessionDir, { recursive: true })

    const filePath = path.join(sessionDir, `${type}.${ext}`)
    fs.writeFileSync(filePath, Buffer.from(buffer))

    return { filePath }
}