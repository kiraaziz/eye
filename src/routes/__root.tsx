import { ThemeProvider } from '@/components/providers/theme-provider'
import { createRootRoute, Outlet } from '@tanstack/react-router'
import { Toaster } from 'sonner'

export const Route = createRootRoute({
  component: () => (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <div className='h-full w-full'>
        <Toaster />
        <Outlet />
      </div>
    </ThemeProvider>
  )
})