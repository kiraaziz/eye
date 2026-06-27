export function recordStream(
    stream: MediaStream,
    mimeType = 'video/webm;codecs=vp9,opus',
    options?: { videoBitsPerSecond?: number; audioBitsPerSecond?: number }
): { stop: () => void; result: Promise<ArrayBuffer> } {
    const chunks: Blob[] = []
    let resolveResult!: (buf: ArrayBuffer) => void
    let rejectResult!: (err: unknown) => void

    const result = new Promise<ArrayBuffer>((res, rej) => {
        resolveResult = res
        rejectResult = rej
    })

    const safeMime = MediaRecorder.isTypeSupported(mimeType)
        ? mimeType
        : MediaRecorder.isTypeSupported('video/webm')
            ? 'video/webm'
            : ''

    const recorder = new MediaRecorder(stream, {
        ...(safeMime ? { mimeType: safeMime } : {}),
        ...(options?.videoBitsPerSecond ? { videoBitsPerSecond: options.videoBitsPerSecond } : {}),
        ...(options?.audioBitsPerSecond ? { audioBitsPerSecond: options.audioBitsPerSecond } : {}),
    })

    recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data)
    }

    recorder.onstop = async () => {
        try {
            const blob = new Blob(chunks, { type: recorder.mimeType || 'video/webm' })
            resolveResult(await blob.arrayBuffer())
        } catch (err) {
            rejectResult(err)
        }
    }

    recorder.onerror = rejectResult
    recorder.start(250)

    return {
        stop: () => { if (recorder.state !== 'inactive') recorder.stop() },
        result,
    }
}