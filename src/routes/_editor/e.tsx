import TopBar from '@/components/global/TopBar'
import { createFileRoute, Outlet } from '@tanstack/react-router'
import { cn } from "@/lib/utils"

export const Route = createFileRoute('/_editor/e')({
    component: RouteComponent,
})

function RouteComponent() {
    return <div className={cn(true && "border shadow-2xl", 'bg-background h-full w-full flex flex-col overflow-hidden')}>
        <TopBar mode='normal' />
        <div className='w-full flex-1 overflow-auto relative'>
            <Outlet />
            <div className="h-full w-full absolute bg-linear-to-b top-0 left-0 to-primary/10 via-secondary/5 opacity-70" />
        </div>
    </div>
}
