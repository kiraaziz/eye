import { app } from "electron"
import path from 'node:path'
import fs from 'node:fs'

export const saveThumbnail = async (_: any, payload: {
    type: 'camera' | 'screen'
    buffer: ArrayBuffer
    sessionId: string
}): Promise<{ filePath: string }> => {
    const { type, buffer, sessionId } = payload

    const sessionDir = path.join(app.getPath('userData'), 'recordings', sessionId)
    fs.mkdirSync(sessionDir, { recursive: true })

    const filePath = path.join(sessionDir, `${type}-thumb.jpg`)
    fs.writeFileSync(filePath, Buffer.from(buffer))

    return { filePath }
}