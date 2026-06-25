import path from 'node:path'
import fs from 'node:fs'
import { getRecordingsRoot } from '../utils/mediaProtocol'

export const deleteRecord = async (_: any, sessionId: string) => {
    const sessionDir = path.join(getRecordingsRoot(), sessionId)

    if (!fs.existsSync(sessionDir)) {
        throw new Error(`Recording not found: ${sessionId}`)
    }

    fs.rmSync(sessionDir, { recursive: true, force: true })
    return { sessionId }
}