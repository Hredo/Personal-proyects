"use client"

import { useEffect, useRef, useState, type RefObject } from "react"

export function useScrollProgress(ref: RefObject<HTMLElement | null>): number {
  const [progress, setProgress] = useState(0)
  const rafRef = useRef<number | null>(null)
  const latestProgress = useRef(0)

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reduce) {
      setProgress(1)
      return
    }

    function update() {
      rafRef.current = null
      const el = ref.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const vh = window.innerHeight || 1
      const start = vh
      const end = -rect.height
      const span = start - end
      const p = Math.max(0, Math.min(1, (start - rect.top) / span))
      if (Math.abs(p - latestProgress.current) > 0.005) {
        latestProgress.current = p
        setProgress(p)
      }
    }

    function onScroll() {
      if (rafRef.current !== null) return
      rafRef.current = requestAnimationFrame(update)
    }

    update()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)
    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [ref])

  return progress
}
