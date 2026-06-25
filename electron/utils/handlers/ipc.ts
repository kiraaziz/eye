import { getScreenSources } from "@/electron/screen/getSources"
import { setWindowBounds } from "@/electron/screen/setWindowBounds"
import { BrowserWindow, ipcMain } from "electron"

export const ipcHandler = (win: BrowserWindow) => {
    
    // ipcMain.handle('toggle-window-mode', () => {
    //     if (win) win = toggleWindowMode(win)
    // })


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