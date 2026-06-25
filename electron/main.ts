import { app, BrowserWindow, ipcMain, screen } from 'electron'
import { createWindow } from './window/createWindow'
import { appHandler } from './utils/handlers/app'
import { ipcHandler } from './utils/handlers/ipc'
import path from 'node:path'
import fs from 'node:fs'

let win: BrowserWindow | null

app.whenReady().then(() => {
  win = createWindow('overlay')

  appHandler()
  ipcHandler(win)

  setupEyeMediaProtocol()
})




































import { initMain } from 'electron-audio-loopback'




import { registerEyeMediaScheme, setupEyeMediaProtocol, toEyeMediaUrl, getRecordingsRoot } from './utils/mediaProtocol'

initMain()




registerEyeMediaScheme()


// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type MouseEventType = 'move' | 'click' | 'mousedown' | 'mouseup' | 'scroll'
type MouseButton = 'left' | 'right' | 'middle'

export type MouseEventEntry = {
  t: number
  x: number
  y: number
  type: MouseEventType
  button?: MouseButton
  scrollDelta?: { x: number; y: number }
}

export type RecordingConfig = {
  cameraId: string | null
  micId: string | null
  speakerId: string | null
  screenId: string | null
}

export type RecordingAssets = {
  camera: string | null
  mic: string | null
  speaker: string | null
  screen: string | null
}

export type DisplayInfo = {
  id: number
  label: string
  bounds: { x: number; y: number; width: number; height: number }
  workArea: { x: number; y: number; width: number; height: number }
  scaleFactor: number
  rotation: number
  isPrimary: boolean
}

export type RecordingMeta = {
  startedAt: number
  durationMs: number
  displays: DisplayInfo[]
  primaryDisplay: DisplayInfo
}

export type RecordingResult = {
  config: RecordingConfig
  assets: RecordingAssets
  meta: RecordingMeta
  mouseEvents: MouseEventEntry[]
}

// ---------------------------------------------------------------------------
// uiohook-napi — load ONCE at module level so the same instance is reused
// ---------------------------------------------------------------------------

const BUTTON_MAP: Record<number, MouseButton> = { 1: 'left', 2: 'right', 3: 'middle' }

let uIOhook: any = null
try {
  uIOhook = require('uiohook-napi').uIOhook
  console.log('[mouse] uiohook-napi loaded')
} catch {
  console.warn('[mouse] uiohook-napi not found — clicks/scroll will not be tracked')
}

// ---------------------------------------------------------------------------
// Mouse tracking state
// ---------------------------------------------------------------------------

let mouseInterval: ReturnType<typeof setInterval> | null = null
let mouseEvents: MouseEventEntry[] = []
let sessionStartTime = 0
let lastX = -1
let lastY = -1
const POLL_MS = 50

function now() { return Date.now() - sessionStartTime }

function startMouseTracking() {
  mouseEvents = []
  sessionStartTime = Date.now()
  lastX = -1
  lastY = -1

  // Position polling — works globally regardless of focus
  mouseInterval = setInterval(() => {
    const { x, y } = screen.getCursorScreenPoint()
    if (x !== lastX || y !== lastY) {
      mouseEvents.push({ t: now(), x, y, type: 'move' })
      lastX = x
      lastY = y
    }
  }, POLL_MS)

  // Global click + scroll via the single shared uiohook instance
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
    console.log('[mouse] tracking started')
  }
}

function stopMouseTracking(): MouseEventEntry[] {
  if (mouseInterval) { clearInterval(mouseInterval); mouseInterval = null }

  if (uIOhook) {
    uIOhook.stop()
    uIOhook.removeAllListeners()
    console.log('[mouse] tracking stopped, events collected:', mouseEvents.length)
  }

  const result = [...mouseEvents]
  result.sort((a, b) => a.t - b.t)
  mouseEvents = []
  return result
}

// ---------------------------------------------------------------------------
// Display helpers
// ---------------------------------------------------------------------------

function getDisplaysMeta(): { displays: DisplayInfo[]; primaryDisplay: DisplayInfo } {
  const all = screen.getAllDisplays()
  const primary = screen.getPrimaryDisplay()

  const map = (d: Electron.Display): DisplayInfo => ({
    id: d.id,
    label: (d as any).label ?? `Display ${d.id}`,
    bounds: d.bounds,
    workArea: d.workArea,
    scaleFactor: d.scaleFactor,
    rotation: d.rotation,
    isPrimary: d.id === primary.id,
  })

  return { displays: all.map(map), primaryDisplay: map(primary) }
}

// ---------------------------------------------------------------------------
// Recording IPC handlers
// ---------------------------------------------------------------------------

// Change this variable from const to let so we can update it

ipcMain.handle('record:start', async () => {
  startMouseTracking() // Starts collecting move/click events
  const { displays, primaryDisplay } = getDisplaysMeta()
  // Return a preliminary timestamp, we will overwrite this below
  return { sessionId: `session_${Date.now()}`, displays, primaryDisplay, startedAt: Date.now() }
})

// ADD THIS NEW HANDLER:
ipcMain.handle('record:syncTimeline', async () => {
  sessionStartTime = Date.now()
  // Clear any mouse events recorded during the hardware setup delay
  mouseEvents = []
  console.log('[mouse] Timeline synchronized with screen recorder start.')
  return { startedAt: sessionStartTime }
})

ipcMain.handle('record:saveTrack', async (_, payload: {
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
})

ipcMain.handle('record:finalise', async (_, payload: {
  sessionId: string
  config: RecordingConfig
  savedPaths: Partial<RecordingAssets>
  durationMs: number
}): Promise<RecordingResult & { sessionId: string }> => {
  const { sessionId, config, savedPaths, durationMs } = payload

  const collectedEvents = stopMouseTracking()
  const { displays, primaryDisplay } = getDisplaysMeta()

  const toUrl = (p?: string | null) => (p ? toEyeMediaUrl(p) : null)

  const assets: RecordingAssets = {
    camera: toUrl(savedPaths.camera),
    mic: toUrl(savedPaths.mic),
    speaker: toUrl(savedPaths.speaker),
    screen: toUrl(savedPaths.screen),
  }

  const meta: RecordingMeta = { startedAt: sessionStartTime, durationMs, displays, primaryDisplay }
  const result: RecordingResult = { config, assets, meta, mouseEvents: collectedEvents }

  const sessionDir = path.join(app.getPath('userData'), 'recordings', sessionId)
  fs.mkdirSync(sessionDir, { recursive: true })
  fs.writeFileSync(path.join(sessionDir, 'manifest.json'), JSON.stringify(result, null, 2))

  console.log('[record] manifest saved →', path.join(sessionDir, 'manifest.json'))
  return { sessionId, ...result }
})

// ---------------------------------------------------------------------------
// Recordings library IPC
// ---------------------------------------------------------------------------

type TrackName = 'screen' | 'camera' | 'mic' | 'speaker'

function assetUrlForTrack(sessionDir: string, track: TrackName): string | null {
  const filePath = path.join(sessionDir, `${track}.webm`)
  return fs.existsSync(filePath) ? toEyeMediaUrl(filePath) : null
}

function resolveAssets(sessionDir: string, raw: RecordingAssets): RecordingAssets {
  return {
    screen: raw.screen ? assetUrlForTrack(sessionDir, 'screen') : null,
    camera: raw.camera ? assetUrlForTrack(sessionDir, 'camera') : null,
    mic: raw.mic ? assetUrlForTrack(sessionDir, 'mic') : null,
    speaker: raw.speaker ? assetUrlForTrack(sessionDir, 'speaker') : null,
  }
}

ipcMain.handle('recordings:list', async () => {
  const root = getRecordingsRoot()
  if (!fs.existsSync(root)) return []

  const entries = fs.readdirSync(root, { withFileTypes: true }).filter((d) => d.isDirectory())
  const items: Array<{
    sessionId: string
    startedAt: number
    durationMs: number
    hasScreen: boolean
    hasCamera: boolean
    hasMic: boolean
    hasSpeaker: boolean
  }> = []

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
      })
    } catch {
      console.warn('[recordings] skipping invalid manifest:', manifestPath)
    }
  }

  return items.sort((a, b) => b.startedAt - a.startedAt)
})

ipcMain.handle('recordings:load', async (_, sessionId: string) => {
  const sessionDir = path.join(getRecordingsRoot(), sessionId)
  const manifestPath = path.join(sessionDir, 'manifest.json')

  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Recording not found: ${sessionId}`)
  }

  const raw = JSON.parse(fs.readFileSync(manifestPath, 'utf-8')) as RecordingResult
  const assets = resolveAssets(sessionDir, raw.assets)

  return { sessionId, ...raw, assets } satisfies RecordingResult & { sessionId: string }
})