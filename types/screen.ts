export interface ScreenSource {
  id: string
  name: string
  icon: string | null
  thumbnail: string
  displayId: string
}

export type DisplayInfo = {
    id: number
    label: string
    bounds: { x: number; y: number; width: number; height: number }
    workArea: { x: number; y: number; width: number; height: number }
    scaleFactor: number
    rotation: number
    isPrimary: boolean
}