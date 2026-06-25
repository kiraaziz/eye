import { useWindowStore } from "@/store/windowStore"
import TopBar from '@/components/global/TopBar'
import { createFileRoute, Outlet } from '@tanstack/react-router'
import { useEffect } from "react"
import { cn } from "@/lib/utils"

export const Route = createFileRoute('/e')({
    component: RouteComponent,
})

function RouteComponent() {
    const init = useWindowStore((s) => s.init)
    const isMaximized = useWindowStore((s) => s.isMaximized)

    useEffect(() => {
        init()
    }, [init])

    return <div className={cn(!isMaximized && "border rounded-2xl shadow-2xl" , 'bg-background h-full w-full flex flex-col overflow-hidden')}>
        <TopBar mode='normal' />
        <div className='w-full flex-1 overflow-auto'>
            <Outlet />
        </div>
    </div>
}
