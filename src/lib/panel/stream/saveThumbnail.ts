export async function saveThumbnail(
    type: 'camera' | 'screen',
    buffer: ArrayBuffer,
    sessionId: string
): Promise<string> {
    const { filePath } = await window.ipcRenderer.invoke('record:saveThumbnail', { type, buffer, sessionId })
    return filePath
}