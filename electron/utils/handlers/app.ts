import { app } from "electron"

export const appHandler = () => {
    app.commandLine.appendSwitch('disable-features', 'WindowsGraphicsCapture')

    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') {
            app.quit()
        }
    })
}