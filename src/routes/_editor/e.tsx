import TopBar from '@/components/global/TopBar'
import { createFileRoute, Outlet } from '@tanstack/react-router'
import { cn } from "@/lib/utils"

export const Route = createFileRoute('/_editor/e')({
    component: RouteComponent,
})

function RouteComponent() {
    return <div className={cn(true && "border shadow-2xl", 'bg-background h-full w-full flex flex-col overflow-hidden')}>
        <TopBar mode='normal' />
        <div className='w-full flex-1 overflow-auto'>
            <Outlet />
        </div>
    </div>
}
