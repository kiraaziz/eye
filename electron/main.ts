import { app, BrowserWindow, ipcMain, shell, screen } from 'electron'
import { createWindow } from './window/createWindow'
import { initMain } from 'electron-audio-loopback'
import { registerEyeMediaScheme, setupEyeMediaProtocol, } from './utils/mediaProtocol'
import { finalise } from "electron/record/finalise"
import { saveThumbnail } from "electron/record/saveThumbnail"
import { saveTrack } from "electron/record/saveTrack"
import { startRecord } from "electron/record/startRecord"
import { syncTimeline } from "electron/record/syncTimeline"
import { listRecord } from './data/listRecord'
import { loadRecord } from './data/loadRecord'
import { deleteRecord } from './data/deleteRecord'
import { getScreenSources } from './screen/getSources'
import { setWindowBounds } from './screen/setWindowBounds'

initMain()
registerEyeMediaScheme()

app.whenReady().then(() => {
  const win: BrowserWindow | null = createWindow()

  // DATA
  ipcMain.handle('recordings:list', listRecord)
  ipcMain.handle('recordings:load', loadRecord)
  ipcMain.handle('recordings:delete', deleteRecord)

  // RECODRING
  ipcMain.handle('record:saveTrack', saveTrack)
  ipcMain.handle('record:start', startRecord)
  ipcMain.handle('record:syncTimeline', syncTimeline)
  ipcMain.handle('record:finalise', finalise)
  ipcMain.handle('record:saveThumbnail', saveThumbnail)


  // APP HANDLER
  app.commandLine.appendSwitch('disable-features', 'WindowsGraphicsCapture')
  app.on('window-all-closed', () => (process.platform !== 'darwin') && app.quit())

  // UTILS HANDLER
  ipcMain.handle('screen:getSources', getScreenSources)
  ipcMain.handle('screen:setSource', async (_, sourceId: string) => await setWindowBounds(sourceId, win))

  ipcMain.handle('window:minimize', () => win?.minimize())
  ipcMain.handle('window:close', () => win?.close())


  ipcMain.handle('window:maximize', () => win?.isMaximized() ? win.unmaximize() : win?.maximize())
  ipcMain.handle('window:isMaximized', () => win?.isMaximized() ?? false)
  win?.on('maximize', () => win?.webContents.send('window:maximized-change', true))
  win?.on('unmaximize', () => win?.webContents.send('window:maximized-change', false))

  ipcMain.handle('open-external', async (_event, url) => await shell.openExternal(url))


  ipcMain.handle("window:toggleMode", async (_, mode: "overlay" | "normal") => {
    if (!win) return

    if (mode === "overlay") {
      win.setResizable(false)

      const winBounds = win.getBounds()
      const display = screen.getDisplayMatching(winBounds)

      const { x, y, width, height } = display.workArea
      win.setBounds({ x, y, width, height })

    } else {
      win.setResizable(true)
      win.setSize(1024, 720)
      win.center()
    }
  })

  //REGISTERY
  setupEyeMediaProtocol()
})
