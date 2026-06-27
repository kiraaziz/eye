import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

type Props = {
    start: boolean
    onComplete: () => void
    durationMs?: number
}

export default function CountdownOverlay({
    start,
    onComplete,
    durationMs = 1000,
}: Props) {
    const [count, setCount] = useState<number | null>(null)

    useEffect(() => {
        if (!start) return

        let current = 3
        setCount(current)

        const interval = setInterval(() => {
            current -= 1

            if (current === 0) {
                clearInterval(interval)
                setCount(null)
                onComplete()
                return
            }

            setCount(current)
        }, durationMs)

        return () => clearInterval(interval)
    }, [start])

    return (
        <AnimatePresence>
            {count !== null && (
            <motion.div
                className="fixed inset-0 z-999 flex items-center justify-center bg-black/60"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                <motion.div
                    key={count}
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 1.2, opacity: 0 }}
                    className="text-7xl font-bold text-white"
                >
                    <div className="relative flex flex-col items-center justify-center pt-7">
                        <div className='relative w-100 h-100 flex items-center justify-center'>
                            <div className='absolute translate-y-5'>
                                {count || 0}
                            </div>
                            <img src="./svg/wings.svg" className="absolute -translate-y-7" />
                            <img src="./svg/wings.svg" className="absolute -translate-y-7 blur-xl opacity-40" />
                        </div>
                    </div>
                </motion.div>
            </motion.div>
            )}
        </AnimatePresence>
    )
}