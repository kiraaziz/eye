import { app, BrowserWindow } from 'electron'
import { createWindow } from './window/createWindow'
import { appHandler } from './utils/handlers/app'
import { ipcHandler } from './utils/handlers/ipc'
import { initMain } from 'electron-audio-loopback'
import {
  registerEyeMediaScheme,
  setupEyeMediaProtocol,
} from './utils/mediaProtocol'
import { recorder } from './utils/handlers/recorder'
import { loader } from './utils/handlers/loader'


let win: BrowserWindow | null

initMain()
registerEyeMediaScheme()

app.whenReady().then(() => {
  win = createWindow('normal')

  appHandler()
  ipcHandler(win)
  recorder()
  loader()

  setupEyeMediaProtocol()
})
