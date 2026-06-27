export async function captureThumbnail(
    stream: MediaStream,
    options?: { maxWidth?: number; mimeType?: 'image/jpeg' | 'image/png'; quality?: number }
): Promise<Blob | undefined> {
    const { maxWidth = 480, mimeType = 'image/jpeg', quality = 0.8 } = options ?? {}

    const videoTrack = stream.getVideoTracks()[0]
    if (!videoTrack) return undefined

    const video = document.createElement('video')
    video.muted = true
    video.playsInline = true
    video.srcObject = new MediaStream([videoTrack])

    try {
        await new Promise<void>((resolve, reject) => {
            video.onloadedmetadata = () => resolve()
            video.onerror = () => reject(new Error('thumbnail: video load failed'))
            video.play().catch(reject)
        })

        await new Promise((r) => setTimeout(r, 120))

        const scale = Math.min(1, maxWidth / video.videoWidth)
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(video.videoWidth * scale)
        canvas.height = Math.round(video.videoHeight * scale)

        const ctx = canvas.getContext('2d')
        if (!ctx) return undefined
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

        return await new Promise<Blob | undefined>((resolve) => {
            canvas.toBlob((blob) => resolve(blob ?? undefined), mimeType, quality)
        })
    } finally {
        video.pause()
        video.srcObject = null
    }
}