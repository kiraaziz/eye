export type MouseEventType = 'move' | 'click' | 'mousedown' | 'mouseup' | 'scroll'
export type MouseButton = 'left' | 'right' | 'middle'

export type MouseEventEntry = {
    t: number
    x: number
    y: number
    type: MouseEventType
    button?: MouseButton
    scrollDelta?: { x: number; y: number }
}

