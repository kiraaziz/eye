import { BrowserWindow } from "electron"

interface Bounds {
    x: number
    y: number
    width: number
    height: number
}

function easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

export function animateWindowBounds(
    win: BrowserWindow,
    target: Bounds,
    duration = 220
): Promise<void> {
    return new Promise((resolve) => {
        const start = win.getBounds()
        const startTime = Date.now()

        const tick = () => {
            if (win.isDestroyed()) return resolve()

            const elapsed = Date.now() - startTime
            const t = Math.min(elapsed / duration, 1)
            const eased = easeInOutCubic(t)

            win.setBounds({
                x: Math.round(start.x + (target.x - start.x) * eased),
                y: Math.round(start.y + (target.y - start.y) * eased),
                width: Math.round(start.width + (target.width - start.width) * eased),
                height: Math.round(start.height + (target.height - start.height) * eased),
            })

            if (t < 1) {
                setTimeout(tick, 1000 / 500) 
            } else {
                resolve()
            }
        }

        tick()
    })
}