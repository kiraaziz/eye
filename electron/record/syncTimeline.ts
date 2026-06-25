import { resetSession } from "./mouse"

export const syncTimeline = async () => {
    const startedAt = resetSession()

    return {
        startedAt
    }
}