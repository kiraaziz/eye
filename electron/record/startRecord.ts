import { getDisplaysMeta } from "../screen/getDisplaysMeta"
import { startMouseTracking } from "./mouse"

export const startRecord = async () => {
    startMouseTracking()
    const { displays, primaryDisplay } = getDisplaysMeta()
    return {
        sessionId: `session_${Date.now()}`,
        displays,
        primaryDisplay,
        startedAt: Date.now()
    }
}