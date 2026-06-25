import { ipcMain } from "electron"
import { saveTrack } from "@/electron/record/saveTrack"
import { startRecord } from "@/electron/record/startRecord"
import { syncTimeline } from "@/electron/record/syncTimeline"
import { finalise } from "@/electron/record/finalise"
import { saveThumbnail } from "@/electron/record/saveThumbnail"

export const recorder = () => {

    ipcMain.handle('record:saveTrack', saveTrack)
    ipcMain.handle('record:start', startRecord)
    ipcMain.handle('record:syncTimeline', syncTimeline)
    ipcMain.handle('record:finalise', finalise)
    ipcMain.handle('record:saveThumbnail', saveThumbnail)

}