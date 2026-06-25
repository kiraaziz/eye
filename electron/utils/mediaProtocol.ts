import { app, net, protocol } from 'electron'
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

export const EYE_MEDIA_SCHEME = 'eye-media'

export function getRecordingsRoot(): string {
  return path.join(app.getPath('userData'), 'recordings')
}

export function toEyeMediaUrl(filePath: string): string {
  return `${EYE_MEDIA_SCHEME}://local/?path=${encodeURIComponent(filePath)}`
}

export function registerEyeMediaScheme(): void {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: EYE_MEDIA_SCHEME,
      privileges: {
        standard: true,
        secure: true,
        bypassCSP: true,
        supportFetchAPI: true,
        stream: true,
        corsEnabled: true,
      },
    },
  ])
}

export function setupEyeMediaProtocol(): void {
  const recordingsRoot = path.resolve(getRecordingsRoot())

  protocol.handle(EYE_MEDIA_SCHEME, (request) => {
    try {
      const url = new URL(request.url)
      const filePath = url.searchParams.get('path')
      if (!filePath) {
        return new Response('Missing path', { status: 400 })
      }

      const resolved = path.resolve(filePath)
      const root = recordingsRoot.toLowerCase()
      if (!resolved.toLowerCase().startsWith(root)) {
        return new Response('Forbidden', { status: 403 })
      }

      if (!fs.existsSync(resolved)) {
        return new Response('Not found', { status: 404 })
      }

      return net.fetch(pathToFileURL(resolved).toString())
    } catch (err) {
      return new Response('Internal error', { status: 500 })
    }
  })
}
