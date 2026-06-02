"use client"

import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion"
import type { ReactNode } from "react"

type FloatProps = Omit<HTMLMotionProps<"div">, "children" | "animate"> & {
  children: ReactNode
  duration?: number
  y?: number
}

export function Float({ children, duration = 6, y = 12, ...rest }: FloatProps) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      animate={reduce ? undefined : { y: [-y, y, -y] }}
      transition={{ duration, repeat: Infinity, ease: "easeInOut" }}
      {...rest}
    >
      {children}
    </motion.div>
  )
}

export default Float
