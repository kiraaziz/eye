import { getScreenSources } from "@/electron/screen/getSources"
import { setWindowBounds } from "@/electron/screen/setWindowBounds"
import { animateWindowBounds } from "@/electron/window/animateWindowBounds"
import { BrowserWindow, ipcMain, shell, screen } from "electron"

const DEFAULT_WIDTH = 1200
const DEFAULT_HEIGHT = 600

export const ipcHandler = (win: BrowserWindow) => {

    let isMaximized = false

    const maximizeToFullscreen = async () => {
        const display = screen.getDisplayMatching(win.getBounds())
        await animateWindowBounds(win, display.workArea)
        isMaximized = true
        win.webContents.send('window:maximized-change', true)
    }

    const restoreToDefault = async () => {
        const display = screen.getDisplayMatching(win.getBounds())
        const { x, y, width, height } = display.workArea
        await animateWindowBounds(win, {
            x: x + Math.round((width - DEFAULT_WIDTH) / 2),
            y: y + Math.round((height - DEFAULT_HEIGHT) / 2),
            width: DEFAULT_WIDTH,
            height: DEFAULT_HEIGHT,
        })
        isMaximized = false
        win.webContents.send('window:maximized-change', false)
    }

    ipcMain.handle('screen:getSources', getScreenSources)
    ipcMain.handle('screen:setSource', async (_, sourceId: string) => {
        await setWindowBounds(sourceId, win)
    })
    ipcMain.handle('window:minimize', () => win?.minimize())
    ipcMain.handle('window:close', () => win?.close())

    ipcMain.handle('window:maximize', async () => {
        if (!win) return
        if (isMaximized) {
            await restoreToDefault()
        } else {
            await maximizeToFullscreen()
        }
    })

    ipcMain.handle('window:isMaximized', () => isMaximized)


    ipcMain.handle("window:toggleMode", async (_, mode: "overlay" | "normal") => {
        if (!win) return

        if (mode === "overlay") {
            win.setResizable(false)

            const winBounds = win.getBounds()
            const display = screen.getDisplayMatching(winBounds)

            const { x, y, width, height } = display.workArea
            win.setBounds({ x, y, width, height })

            win.setAlwaysOnTop(true, "screen-saver")
        } else {
            win.setResizable(true)
            win.setAlwaysOnTop(false)

            if (!isMaximized) {
                await maximizeToFullscreen()
            }
        }
    })

    ipcMain.handle('open-external', async (_event, url) => {
        await shell.openExternal(url)
    })
}