import { screen } from 'electron'
import { DisplayInfo } from 'types/screen';

export function getDisplaysMeta(): { displays: DisplayInfo[]; primaryDisplay: DisplayInfo } {
    const all = screen.getAllDisplays()
    const primary = screen.getPrimaryDisplay()

    const map = (d: Electron.Display): DisplayInfo => ({
        id: d.id,
        label: (d as any).label ?? `Display ${d.id}`,
        bounds: d.bounds,
        workArea: d.workArea,
        scaleFactor: d.scaleFactor,
        rotation: d.rotation,
        isPrimary: d.id === primary.id,
    })

    return {
        displays: all.map(map),
        primaryDisplay: map(primary)
    }
}