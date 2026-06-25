import path from 'node:path'
import { BrowserWindow } from 'electron'
import { RENDERER_DIST, VITE_DEV_SERVER_URL, __dirname } from '../utils/constant'


export function createWindow(): BrowserWindow {
    const win = new BrowserWindow({
        icon: path.join(process.env.VITE_PUBLIC!, 'logo.png'),
        minWidth: 1200,
        minHeight: 600,
        width: 1200,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.mjs'),
            nodeIntegration: true,
            contextIsolation: true,
        },

        frame: false,
        autoHideMenuBar: true,
        backgroundColor: '#00000000',
        hasShadow: false,
        transparent: true,
        resizable: false,
    })

    win.setMenu(null)

    if (VITE_DEV_SERVER_URL) {
        win.loadURL(`${VITE_DEV_SERVER_URL}`)
    } else {
        win.loadFile(path.join(RENDERER_DIST, 'index.html'))
    }

    return win
}

