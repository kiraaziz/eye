import { listRecord } from "@/electron/data/listRecord"
import { loadRecord } from "@/electron/data/loadRecord"
import { ipcMain } from "electron"

export const loader = () => {
    ipcMain.handle('recordings:list', listRecord)
    ipcMain.handle('recordings:load', loadRecord)
}