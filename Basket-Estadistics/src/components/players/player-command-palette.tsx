"use client"

import { AnimatePresence, motion } from "framer-motion"
import { useCallback, useEffect, useRef, useState } from "react"
import { PlayerSearch, type PlayerSearchHandle } from "./player-search"

export function PlayerCommandPalette() {
  const searchRef = useRef<PlayerSearchHandle>(null)
  const [open, setOpen] = useState(false)
  const [isMac, setIsMac] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return
    setIsMac(/Mac|iPhone|iPad/.test(navigator.platform))
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const isShortcut =
        (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k"
      if (isShortcut) {
        e.preventDefault()
        setOpen((v) => !v)
        return
      }
      if (e.key === "/" && !open) {
        const target = e.target as HTMLElement | null
        const isFormField =
          target &&
          (target.tagName === "INPUT" ||
            target.tagName === "TEXTAREA" ||
            target.tagName === "SELECT" ||
            target.isContentEditable)
        if (!isFormField) {
          e.preventDefault()
          setOpen(true)
        }
      }
    }
    function onOpen() {
      setOpen(true)
    }
    document.addEventListener("keydown", onKey)
    document.addEventListener("open-search-palette", onOpen)
    return () => {
      document.removeEventListener("keydown", onKey)
      document.removeEventListener("open-search-palette", onOpen)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => searchRef.current?.open())
    }
  }, [open])

  const close = useCallback(() => setOpen(false), [])

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="palette"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[10vh] sm:pt-[12vh]"
          aria-modal="true"
          role="dialog"
          aria-label="Search players"
        >
          <button
            type="button"
            aria-label="Close search"
            onClick={close}
            className="absolute inset-0 bg-ink-950/70 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="relative z-10 w-full max-w-2xl"
          >
            <div className="mb-3 flex items-center justify-between px-1 text-xs text-ink-300">
              <span className="font-mono uppercase tracking-widest text-ink-400">
                Player search
              </span>
              <span className="hidden items-center gap-1 sm:inline-flex">
                <kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-ink-300">
                  {isMac ? "⌘" : "Ctrl"}
                </kbd>
                <kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-ink-300">
                  K
                </kbd>
                <span className="ml-1 text-ink-500">to toggle</span>
              </span>
            </div>
            <PlayerSearch
              ref={searchRef}
              variant="modal"
              onPick={() => setOpen(false)}
            />
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
