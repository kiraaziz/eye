import { screen } from 'electron'
import { MouseEventEntry } from "@/types/recording"

export type MouseButton = 'left' | 'right' | 'middle'

const BUTTON_MAP: Record<number, MouseButton> = { 1: 'left', 2: 'right', 3: 'middle' }

let uIOhook: any = null
try {
    uIOhook = require('uiohook-napi').uIOhook
} catch {
    console.warn('[mouse] uiohook-napi not found — clicks/scroll will not be tracked')
}

let mouseInterval: ReturnType<typeof setInterval> | null = null
export let mouseEvents: MouseEventEntry[] = []
export let sessionStartTime = 0
let lastX = -1
let lastY = -1
const POLL_MS = 50

function now() { return Date.now() - sessionStartTime }

export function startMouseTracking() {
    mouseEvents = []
    sessionStartTime = Date.now()
    lastX = -1
    lastY = -1

    mouseInterval = setInterval(() => {
        const { x, y } = screen.getCursorScreenPoint()
        if (x !== lastX || y !== lastY) {
            mouseEvents.push({ t: now(), x, y, type: 'move' })
            lastX = x
            lastY = y
        }
    }, POLL_MS)

    if (uIOhook) {
        uIOhook.removeAllListeners()

        uIOhook.on('mousedown', (e: any) => {
            mouseEvents.push({ t: now(), x: e.x, y: e.y, type: 'mousedown', button: BUTTON_MAP[e.button] ?? 'left' })
        })

        uIOhook.on('mouseup', (e: any) => {
            mouseEvents.push({ t: now(), x: e.x, y: e.y, type: 'mouseup', button: BUTTON_MAP[e.button] ?? 'left' })
            mouseEvents.push({ t: now(), x: e.x, y: e.y, type: 'click', button: BUTTON_MAP[e.button] ?? 'left' })
        })

        uIOhook.on('wheel', (e: any) => {
            mouseEvents.push({
                t: now(), x: e.x, y: e.y, type: 'scroll',
                scrollDelta: { x: 0, y: e.rotation * e.delta },
            })
        })

        uIOhook.start()
    }
}

export function stopMouseTracking(): MouseEventEntry[] {
    if (mouseInterval) { clearInterval(mouseInterval); mouseInterval = null }

    if (uIOhook) {
        uIOhook.stop()
        uIOhook.removeAllListeners()
    }

    const result = [...mouseEvents]
    result.sort((a, b) => a.t - b.t)
    mouseEvents = []
    return result
}

export function resetSession() {
    mouseEvents = []
    sessionStartTime = Date.now()
    return sessionStartTime
}