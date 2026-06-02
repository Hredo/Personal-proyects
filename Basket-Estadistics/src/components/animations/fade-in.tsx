"use client"

import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion"
import type { ReactNode } from "react"

type FadeInProps = Omit<HTMLMotionProps<"div">, "children"> & {
  children: ReactNode
  delay?: number
  y?: number
}

export function FadeIn({ children, delay = 0, y = 24, ...rest }: FadeInProps) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
      {...rest}
    >
      {children}
    </motion.div>
  )
}

export default FadeIn
