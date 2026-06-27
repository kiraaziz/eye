export default function Overlay({ showFrame }: { showFrame: boolean }) {
    return (
        <>
            {showFrame && <div className="absolute top-0 left-0 h-full w-full  border-2 border-dashed bg-background/30" />}
            <div onClick={() => window.ipcRenderer.invoke('window:minimize')} className="absolute top-0 left-0 h-full w-full" />
        </>
    )
}
