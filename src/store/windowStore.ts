import { create } from "zustand"

interface WindowState {
    isMaximized: boolean
    isInitialized: boolean
    init: () => void
    toggleMaximize: () => void
}

export const useWindowStore = create<WindowState>((set, get) => ({
    isMaximized: false,
    isInitialized: false,

    init: () => {
        if (get().isInitialized) return
        set({ isInitialized: true })

        let receivedPush = false

        window.ipcRenderer.on('window:maximized-change', (_: unknown, value: boolean) => {
            receivedPush = true
            set({ isMaximized: value })
        })

        window.ipcRenderer.invoke('window:isMaximized').then((value: boolean) => {
            if (receivedPush) return
            set({ isMaximized: value })
        })
    },

    toggleMaximize: () => {
        window.ipcRenderer.invoke('window:maximize')
    },
}))