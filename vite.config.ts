import { defineConfig } from 'vite'
import path from 'node:path'
import electron from 'vite-plugin-electron/simple'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'

const electronAliases = {
  'electron/record': path.resolve(__dirname, 'electron/record'),
  'electron/data': path.resolve(__dirname, 'electron/data'),
  'electron/screen': path.resolve(__dirname, 'electron/screen'),
  'electron/window': path.resolve(__dirname, 'electron/window'),
  'electron/utils': path.resolve(__dirname, 'electron/utils'),
  'types': path.resolve(__dirname, 'types'),
}

export default defineConfig({
  plugins: [
    TanStackRouterVite(),
    react(),
    tailwindcss(),

    electron({
      main: {
        entry: 'electron/main.ts',
        vite: {
          resolve: {
            alias: {
              '@': path.resolve(__dirname, '.'),
              ...electronAliases,
            },
          },
        },
      },
      preload: {
        input: path.join(__dirname, 'electron/preload.ts'),
        vite: {
          resolve: {
            alias: {
              '@': path.resolve(__dirname, '.'),
              ...electronAliases,
            },
          },
        },
      },
      renderer: process.env.NODE_ENV === 'test'
        ? undefined
        : {},
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})