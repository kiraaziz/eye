import path from 'node:path'
import { BrowserWindow, screen } from 'electron'
import { RENDERER_DIST, VITE_DEV_SERVER_URL, __dirname } from '../utils/constant'

export type WindowMode = 'normal' | 'overlay'

function baseOptions() {
    return {
        icon: path.join(process.env.VITE_PUBLIC!, 'electron-vite.svg'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.mjs'),
            nodeIntegration: true,
            contextIsolation: true,
        },
    }
}

function overlayOptions() {
    return {
        frame: false,
        autoHideMenuBar: true,
        backgroundColor: '#00000000',
        hasShadow: false,
        transparent: true,
        resizable: false,
    }
}

export function createWindow(mode: WindowMode = 'normal'): BrowserWindow {
    const options = mode === 'overlay'
        ? { ...baseOptions(), ...overlayOptions() }
        : baseOptions()

    const win = new BrowserWindow(options)

    if (mode === 'overlay') {
        const { x, y, width, height } = win.getBounds()
        win.setBounds({ x, y, width, height })
    }

    win.setMenu(null)

    if (VITE_DEV_SERVER_URL) {
        win.loadURL(`${VITE_DEV_SERVER_URL}`)
    } else {
        win.loadFile(path.join(RENDERER_DIST, 'index.html'))
    }

    return win
}

