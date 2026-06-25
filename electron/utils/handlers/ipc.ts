import { getScreenSources } from "@/electron/screen/getSources"
import { setWindowBounds } from "@/electron/screen/setWindowBounds"
import { BrowserWindow, ipcMain } from "electron"

export const ipcHandler = (win: BrowserWindow) => {

    ipcMain.handle("window:toggleMode", (_, mode: "overlay" | "bormal") => {
        if (!win) return

        if (mode === "overlay") {
            win.setResizable(false)

            const { x, y, width, height } = win.getBounds()
            win.setBounds({ x, y, width, height })

            win.setAlwaysOnTop(true, "screen-saver")
        } else {
            win.setResizable(true)
            win.setAlwaysOnTop(false)

            win.maximize()
        }
    })
    
    ipcMain.handle('screen:getSources', getScreenSources)
    ipcMain.handle('screen:setSource', (_, sourceId: string) => {
        setWindowBounds(sourceId, win)
    })

    ipcMain.handle('window:minimize', () => win?.minimize())
    ipcMain.handle('window:close', () => win?.close())
    ipcMain.handle('window:maximize', () => {
        if (win) {
            win.isMaximized() ? win.unmaximize() : win.maximize()
        }
    })
}