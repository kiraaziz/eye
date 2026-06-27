import { Link } from "@tanstack/react-router"
import { Button } from "../ui/button"
import { Clapperboard, Folder, Maximize2, Minimize2, MinusIcon } from "lucide-react"
import { XMarkIcon } from "@heroicons/react/24/solid"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"

export default function TopBar({ mode = "normal" }: { mode: "record" | "normal" }) {

    const [isMaximized, setIsMaximized] = useState(false)

    useEffect(() => {
        const handler = (_: unknown, value: boolean) => setIsMaximized(value)
        window.ipcRenderer.on("window:maximized-change", handler);

        (async () => {
            const initial = await window.ipcRenderer.invoke("window:isMaximized")
            setIsMaximized(initial)
        })()

        return () => {
            window.ipcRenderer.off("window:maximized-change", handler)
        }
    }, [])

    return (
        <div className={cn(mode === "normal" && "top-bar", "flex w-full items-center justify-between border-b border-border/50 bg-muted p-2 relative")}>
            <div className="w-[40%] opacity-60 top-bar h-full absolute top-0 right-0 bg-linear-to-l from-secondary/10 via-primary/5 pointer-events-none" />
            <div className="flex items-center justify-center gap-2">
                {mode === "record" ? <Link to="/e">
                    <Button variant="outline" className='font-light'>
                        <Folder className="size-4" />
                        Records
                    </Button>
                </Link>
                    : <Link to="/">
                        <Button variant="outline" className='font-light'>
                            <Clapperboard className="size-4" />
                            Record
                        </Button>
                    </Link>}
                <Button
                    variant="outline"
                    className="font-light"
                    onClick={() => {
                        window.ipcRenderer.invoke('open-external', "https://github.com/kiraaziz")
                        window.ipcRenderer.invoke("window:minimize")
                    }}
                >
                    <img src="/svg/github.svg" className="size-4" />
                    Github
                </Button>
            </div>
            <div className="flex items-center justify-center gap-4 text-foreground/70">
                <img src="./logo.svg" className="h-7" />
                <h1>Kira Eye</h1>
            </div>
            <div className="flex items-center justify-center gap-3">
                <Button
                    size="icon-xs"
                    variant="ghost"
                    onClick={() => window.ipcRenderer.invoke('window:minimize')}
                >
                    <MinusIcon className="size-5 text-foreground/60" />
                </Button>
                {mode === "normal" && (
                    <Button size="icon-xs" variant="ghost" onClick={() => window.ipcRenderer.invoke('window:maximize')}>
                        {isMaximized ?
                            <Minimize2 className="size-4 text-foreground/60" />
                            : <Maximize2 className="size-4 text-foreground/60" />
                        }
                    </Button>
                )}
                <Button
                    size="icon-xs"
                    variant="ghost"
                    onClick={() => window.ipcRenderer.invoke('window:close')}
                >
                    <XMarkIcon className="size-5 text-foreground/60" />
                </Button>
            </div>
        </div>
    )
}
