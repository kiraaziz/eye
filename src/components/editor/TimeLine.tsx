// import { useCallback, useRef } from "react"

// function formatRulerLabel(ms: number): string {
//   const s = ms / 1000
//   return s % 1 === 0 ? `${s}s` : `${s.toFixed(1)}s`
// }

export function Timeline() {
  // const totalMs = 60 * 1000 * 2

  // const rulerTicks = Array.from({ length: Math.ceil(totalMs / 3000) + 1 }, (_, i) => i * 3000)

  // const rulerRef = useRef<HTMLDivElement>(null)


  // const seekFromEvent = useCallback(
  //   (e: React.MouseEvent | React.PointerEvent) => {
  //     if (!rulerRef.current) return
  //     const rect = rulerRef.current.getBoundingClientRect()
  //     const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left))
  //   },
  //   [totalMs]
  // )

  return (
    <div className='w-full h-full overflow-auto'>
      {/* <div className="relative px-4 pb-4 pt-2">
        <div
          ref={rulerRef}
          className="relative mb-1 ml-28 h-6 cursor-pointer select-none"
          onClick={seekFromEvent}
        >
          {rulerTicks.map((t) => (
            <div
              key={t}
              className="absolute top-0 flex flex-col items-center"
              style={{ left: `${(t / totalMs) * 100}%` }}
            >
              <div className="h-2 w-px bg-border" />
              <span className="mt-0.5 text-[10px] text-muted-foreground">
                {formatRulerLabel(t)}
              </span>
            </div>
          ))}

          <div
            className="pointer-events-none absolute top-0 bottom-0 z-20 w-0.5 bg-sky-400"
            style={{ left: `${playheadPct}%` }}
          >
            <div className="absolute -left-1.5 -top-1 size-3 rounded-full bg-sky-400 shadow" />
          </div>
        </div>
      </div> */}
    </div>
  )
}

