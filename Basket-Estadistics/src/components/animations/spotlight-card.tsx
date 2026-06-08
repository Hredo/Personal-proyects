"use client"

import {
  useCallback,
  useRef,
  type PointerEvent,
  type ReactNode,
} from "react"
import { cn } from "@/components/ui/cn"

/**
 * Tracks the cursor over an element and writes --mx/--my CSS custom properties
 * (in %), which the `.gh-spotlight` utility uses to render a cursor-following
 * border + inner glow. Pair the returned props with `className="gh-spotlight"`.
 *
 * Works on any element (div, anchor, Link) — keeps clickable cards clickable.
 */
export function useSpotlight<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null)

  const onPointerMove = useCallback((e: PointerEvent<T>) => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    el.style.setProperty("--mx", `${((e.clientX - r.left) / r.width) * 100}%`)
    el.style.setProperty("--my", `${((e.clientY - r.top) / r.height) * 100}%`)
  }, [])

  return { ref, onPointerMove }
}

/**
 * Convenience wrapper: a div with the cursor-tracked spotlight border/glow.
 * Use in server components that need the effect without writing a client file.
 */
export function SpotlightCard({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  const { ref, onPointerMove } = useSpotlight<HTMLDivElement>()
  return (
    <div
      ref={ref}
      onPointerMove={onPointerMove}
      className={cn("gh-spotlight", className)}
    >
      {children}
    </div>
  )
}
