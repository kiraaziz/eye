import { useCameraBubble } from "@/lib/configs/useCameraBubble"
import { motion } from 'framer-motion'
import { useRef } from "react"

export default function CameraBubble({ cameraId }: { cameraId: string | null }) {

    const constraintsRef = useRef(null)
    const { cameraStream, videoRef } = useCameraBubble(cameraId)

    return (
        <>
            <div ref={constraintsRef} className="pointer-events-none absolute inset-5" />
            {cameraStream && (
                <motion.div
                    drag
                    dragTransition={{
                        power: 0.3,
                        timeConstant: 200,
                        bounceStiffness: 300,
                        bounceDamping: 30,
                    }}
                    dragElastic={0.08}
                    initial={{ top: 20, left: 20 }}
                    dragConstraints={constraintsRef}
                    className="fixed z-50 h-36 w-48 cursor-grab select-none overflow-hidden rounded-xl shadow-xl active:cursor-grabbing"
                >
                    <video autoPlay muted ref={videoRef} className="h-full w-full object-cover" />
                </motion.div>
            )}
        </>
    )
}
