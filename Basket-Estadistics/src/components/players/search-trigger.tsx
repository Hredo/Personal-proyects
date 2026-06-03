"use client"

import { useEffect, useState } from "react"

export function SearchTrigger() {
  const [isMac, setIsMac] = useState(false)
  useEffect(() => {
    if (typeof window === "undefined") return
    setIsMac(/Mac|iPhone|iPad/.test(navigator.platform))
  }, [])

  function open() {
    document.dispatchEvent(new CustomEvent("open-search-palette"))
  }

  return (
    <button
      type="button"
      onClick={open}
      aria-label="Search players"
      className="group inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-2 text-sm text-ink-200 transition hover:border-brand-400/40 hover:bg-white/[0.07] hover:text-ink-50 sm:px-3"
    >
      <svg
        aria-hidden
        className="h-4 w-4 text-ink-400 transition group-hover:text-brand-300"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="2"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="m21 21-4.3-4.3M16.65 10.65a6 6 0 1 1-12 0 6 6 0 0 1 12 0Z"
        />
      </svg>
      <span className="hidden md:inline">Search</span>
      <kbd className="ml-1 hidden items-center gap-0.5 rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-ink-300 md:inline-flex">
        <span>{isMac ? "⌘" : "Ctrl"}</span>
        <span>K</span>
      </kbd>
    </button>
  )
}
