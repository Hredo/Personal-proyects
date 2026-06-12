"use client"

import { useEffect, useRef, useState } from "react"

export function StickyFilterBar({
  children,
}: {
  children: React.ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [stuck, setStuck] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const sentinel = document.createElement("div")
    sentinel.style.height = "1px"
    el.parentNode?.insertBefore(sentinel, el)

    const observer = new IntersectionObserver(
      ([entry]) => setStuck(!entry.isIntersecting),
      { threshold: 0 },
    )
    observer.observe(sentinel)

    return () => {
      observer.disconnect()
      sentinel.remove()
    }
  }, [])

  return (
    <div
      ref={ref}
      className={`sticky top-14 z-40 -mx-4 mb-4 px-4 sm:-mx-6 sm:px-6 transition-all duration-500 ease-fluid ${
        stuck ? "shadow-[0_1px_0_0_oklch(1_0_0/0.06)]" : ""
      }`}
    >
      <div
        className={`gh-glass px-3 py-2 sm:px-4 transition-all duration-500 ${
          stuck ? "rounded-b-2xl rounded-t-none" : "rounded-2xl"
        }`}
      >
        {children}
      </div>
    </div>
  )
}
