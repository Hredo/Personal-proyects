"use client"

import { motion, useReducedMotion, type Variants } from "framer-motion"
import type { ComponentProps, ReactNode } from "react"

type Direction = "up" | "down" | "left" | "right" | "none"

const OFFSET: Record<Direction, { x: number; y: number }> = {
  up: { x: 0, y: 28 },
  down: { x: 0, y: -28 },
  left: { x: 36, y: 0 },
  right: { x: -36, y: 0 },
  none: { x: 0, y: 0 },
}

/**
 * Heavy, cinematic in-view reveal — fade + blur-up + translate, spring-eased.
 * GPU-safe (transform/opacity/filter only). Honors reduced-motion.
 */
export function Reveal({
  children,
  delay = 0,
  direction = "up",
  blur = true,
  once = true,
  amount = 0.25,
  className,
  ...rest
}: {
  children: ReactNode
  delay?: number
  direction?: Direction
  blur?: boolean
  once?: boolean
  amount?: number
  className?: string
} & Omit<ComponentProps<typeof motion.div>, "children">) {
  const reduce = useReducedMotion()
  const { x, y } = OFFSET[direction]

  if (reduce) {
    return (
      <div className={className} {...(rest as ComponentProps<"div">)}>
        {children}
      </div>
    )
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, x, y, filter: blur ? "blur(10px)" : "blur(0px)" }}
      whileInView={{ opacity: 1, x: 0, y: 0, filter: "blur(0px)" }}
      viewport={{ once, amount, margin: "0px 0px -8% 0px" }}
      transition={{
        duration: 0.85,
        delay,
        ease: [0.19, 1, 0.22, 1],
      }}
      {...rest}
    >
      {children}
    </motion.div>
  )
}

const containerVariants: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 26, filter: "blur(10px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.8, ease: [0.19, 1, 0.22, 1] },
  },
}

/** Stagger container — children should be <StaggerItem>. */
export function Stagger({
  children,
  className,
  amount = 0.2,
  once = true,
}: {
  children: ReactNode
  className?: string
  amount?: number
  once?: boolean
}) {
  const reduce = useReducedMotion()
  if (reduce) return <div className={className}>{children}</div>
  return (
    <motion.div
      className={className}
      variants={containerVariants}
      initial="hidden"
      whileInView="show"
      viewport={{ once, amount }}
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  const reduce = useReducedMotion()
  if (reduce) return <div className={className}>{children}</div>
  return (
    <motion.div className={className} variants={itemVariants}>
      {children}
    </motion.div>
  )
}
