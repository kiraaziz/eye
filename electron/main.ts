import { app, BrowserWindow, ipcMain, screen } from 'electron'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { getScreenSources } from './screen/getSources'
import { setWindowBounds } from './screen/setWindowBounds'
import { initMain } from 'electron-audio-loopback'
import fs from 'node:fs'

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

process.env.APP_ROOT = path.join(__dirname, '..')

export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST

app.commandLine.appendSwitch('disable-features', 'WindowsGraphicsCapture')

let win: BrowserWindow | null

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    frame: false,
    vibrancy: 'under-window',
    visualEffectState: 'active',
    autoHideMenuBar: true,
    backgroundColor: '#00000000',
    hasShadow: false,
    transparent: true,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      nodeIntegration: true,
      contextIsolation: true,
    },
  })

  const displays = screen.getAllDisplays()
  const { x, y, width, height } = displays[0].bounds
  win.setBounds({ x, y, width, height })
  win.setMenu(null)

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') { app.quit(); win = null }
})
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
app.whenReady().then(createWindow)

initMain()
ipcMain.handle('screen:getSources', getScreenSources)
ipcMain.handle('screen:setSource', (_, sourceId: string) => setWindowBounds(sourceId, win))
ipcMain.handle('window:minimize', () => win?.minimize())
ipcMain.handle('window:close', () => win?.close())
ipcMain.handle('window:maximize', () => {
  if (!win) return
  win.isMaximized() ? win.unmaximize() : win.maximize()
  return win.isMaximized()
})

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
      mouseEvents.push({ t: now(), x: e.x, y: e.y, type: 'click',   button: BUTTON_MAP[e.button] ?? 'left' })
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

ipcMain.handle('record:start', async () => {
  startMouseTracking()
  const { displays, primaryDisplay } = getDisplaysMeta()
  return { sessionId: `session_${sessionStartTime}`, displays, primaryDisplay, startedAt: sessionStartTime }
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
}): Promise<RecordingResult> => {
  const { sessionId, config, savedPaths, durationMs } = payload

  const collectedEvents = stopMouseTracking()
  const { displays, primaryDisplay } = getDisplaysMeta()

  const toUrl = (p?: string | null) => p ? `file://${p}` : null

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
  return result
})