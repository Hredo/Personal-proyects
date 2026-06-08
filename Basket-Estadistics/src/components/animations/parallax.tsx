"use client"

import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
  type MotionStyle,
} from "framer-motion"
import { useRef, type ReactNode } from "react"

/**
 * Scroll-linked parallax drift. `speed` > 0 lags behind scroll (moves down),
 * < 0 races ahead (moves up). Uses transform only.
 */
export function Parallax({
  children,
  speed = 60,
  className,
  style,
}: {
  children: ReactNode
  speed?: number
  className?: string
  style?: MotionStyle
}) {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  })
  const y = useTransform(scrollYProgress, [0, 1], [speed, -speed])

  return (
    <motion.div
      ref={ref}
      className={className}
      style={reduce ? style : { ...style, y }}
    >
      {children}
    </motion.div>
  )
}
