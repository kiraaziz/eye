import { TrackType } from "types/configs"

export async function saveTrack(type: TrackType, buffer: ArrayBuffer, sessionId: string): Promise<string> {
    const { filePath } = await window.ipcRenderer.invoke('record:saveTrack', {
        type, buffer, sessionId, ext: 'webm',
    })
    return filePath
}