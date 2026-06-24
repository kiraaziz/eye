import { BrowserWindow, screen } from "electron"

export function setWindowBounds(sourceId: string, win: BrowserWindow | null) {
    const displays = screen.getAllDisplays()
    const display = displays.find(d => d.id.toString() === sourceId)

    if (!display || !win) return

    const { x, y, width, height } = display.bounds

    win.setBounds({ x, y, width, height })
}