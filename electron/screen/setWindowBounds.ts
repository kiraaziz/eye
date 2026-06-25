import { BrowserWindow, screen } from "electron"
import { animateWindowBounds } from "../window/animateWindowBounds"

export async function setWindowBounds(sourceId: string, win: BrowserWindow | null) {
    const displays = screen.getAllDisplays()
    const display = displays.find(d => d.id.toString() === sourceId)

    if (!display || !win) return

    const { x, y, width, height } = display.bounds

    await animateWindowBounds(win, { x, y, width, height })
}