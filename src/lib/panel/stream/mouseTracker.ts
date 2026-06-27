import { useCallback, useEffect, useRef } from "react";
import { MouseButton, MouseEventType } from "types/mouse";

const BUTTON_MAP: Record<number, MouseButton> = { 0: 'left', 1: 'middle', 2: 'right' }


export function mouseTracker() {
    const isTracking = useRef(false)

    const sendEvent = useCallback((
        type: MouseEventType,
        x: number,
        y: number,
        button?: MouseButton,
        scrollDelta?: { x: number; y: number }
    ) => {
        if (!isTracking.current) return

        
        const absX = Math.round(window.screenX + x)
        const absY = Math.round(window.screenY + y)

        window.ipcRenderer.send('record:mouseEvent', {
            t: 0,          
            x: absX,
            y: absY,
            type,
            ...(button ? { button } : {}),
            ...(scrollDelta ? { scrollDelta } : {}),
        })
    }, [])

    const handleMouseDown = useCallback((e: globalThis.MouseEvent) => {
        sendEvent('mousedown', e.clientX, e.clientY, BUTTON_MAP[e.button])
    }, [sendEvent])

    const handleMouseUp = useCallback((e: globalThis.MouseEvent) => {
        sendEvent('mouseup', e.clientX, e.clientY, BUTTON_MAP[e.button])
    }, [sendEvent])

    const handleClick = useCallback((e: globalThis.MouseEvent) => {
        sendEvent('click', e.clientX, e.clientY, BUTTON_MAP[e.button])
    }, [sendEvent])

    const handleScroll = useCallback((e: WheelEvent) => {
        sendEvent('scroll', e.clientX, e.clientY, undefined, {
            x: Math.round(e.deltaX),
            y: Math.round(e.deltaY),
        })
    }, [sendEvent])

    const startTracking = useCallback(() => {
        if (isTracking.current) return
        isTracking.current = true
        window.addEventListener('mousedown', handleMouseDown, { capture: true })
        window.addEventListener('mouseup', handleMouseUp, { capture: true })
        window.addEventListener('click', handleClick, { capture: true })
        window.addEventListener('wheel', handleScroll, { capture: true, passive: true })
    }, [handleMouseDown, handleMouseUp, handleClick, handleScroll])

    const stopTracking = useCallback(() => {
        isTracking.current = false
        window.removeEventListener('mousedown', handleMouseDown, { capture: true })
        window.removeEventListener('mouseup', handleMouseUp, { capture: true })
        window.removeEventListener('click', handleClick, { capture: true })
        window.removeEventListener('wheel', handleScroll, { capture: true })
    }, [handleMouseDown, handleMouseUp, handleClick, handleScroll])

    
    useEffect(() => () => stopTracking(), [stopTracking])

    return { startTracking, stopTracking }
}
