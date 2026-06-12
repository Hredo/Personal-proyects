"use client"

import { useEffect, useRef, useState, type ComponentType } from "react"

/**
 * Defers the command palette (PlayerSearch and friends) out of the initial
 * bundle. The chunk loads when the browser goes idle, or instantly on the
 * first open intent (Cmd/Ctrl+K, "/", or the navbar search button). An
 * intent that arrives before the chunk is ready is replayed after mount,
 * so the palette still opens from that first keystroke or click.
 */
export function LazyCommandPalette() {
  const [Palette, setPalette] = useState<ComponentType | null>(null)
  const pendingOpen = useRef(false)
  const requested = useRef(false)

  useEffect(() => {
    // Once loaded, the palette owns these events; keeping our listeners
    // attached would double-handle Cmd+K and the open event.
    if (Palette) return

    let cancelled = false

    function load() {
      if (requested.current) return
      requested.current = true
      import("./player-command-palette").then((m) => {
        if (!cancelled) setPalette(() => m.PlayerCommandPalette)
      })
    }

    function loadAndOpen() {
      pendingOpen.current = true
      load()
    }

    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        loadAndOpen()
        return
      }
      if (e.key === "/") {
        const target = e.target as HTMLElement | null
        const isFormField =
          target &&
          (target.tagName === "INPUT" ||
            target.tagName === "TEXTAREA" ||
            target.tagName === "SELECT" ||
            target.isContentEditable)
        if (!isFormField) {
          e.preventDefault()
          loadAndOpen()
        }
      }
    }

    const idleLoad = () => load()
    const idleId =
      typeof window.requestIdleCallback === "function"
        ? window.requestIdleCallback(idleLoad, { timeout: 4000 })
        : window.setTimeout(idleLoad, 2000)

    document.addEventListener("keydown", onKey)
    document.addEventListener("open-search-palette", loadAndOpen)
    return () => {
      cancelled = true
      if (typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleId)
      } else {
        clearTimeout(idleId)
      }
      document.removeEventListener("keydown", onKey)
      document.removeEventListener("open-search-palette", loadAndOpen)
    }
  }, [Palette])

  useEffect(() => {
    if (Palette && pendingOpen.current) {
      pendingOpen.current = false
      // Child effects have already run here, so the palette is listening.
      document.dispatchEvent(new CustomEvent("open-search-palette"))
    }
  }, [Palette])

  if (!Palette) return null
  return <Palette />
}
