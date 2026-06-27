import { desktopCapturer } from "electron"
import { ScreenSource } from "types/screen"

export async function getScreenSources(): Promise<ScreenSource[]> {
    const sources = await desktopCapturer.getSources({
        types: ["screen", "window"],
        thumbnailSize: { width: 300, height: 200 },
        fetchWindowIcons: true
    })

    return sources.map(s => {
        return {
            id: s.id,
            name: s.name,
            icon: s.appIcon && s.appIcon.toDataURL(),
            thumbnail: s.thumbnail.toDataURL(),
            displayId: s.display_id
        }
    })
}
