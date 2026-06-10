"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react"
import { createPortal } from "react-dom"
import { AnimatePresence, motion } from "framer-motion"
import type { ComparePlayer } from "@/lib/data/compare"
import { SmartImage } from "@/components/ui/smart-image"

type LeagueInfo = { id: string; name: string; slug: string; region: string }
type TeamInfo = {
  id: string
  name: string
  slug: string
  logoUrl: string | null
} | null

export type CompareChoice = {
  id: string
  slug: string
  fullName: string
  source: string
  imageUrl: string | null
  position: string | null
  nationality: string | null
  team: TeamInfo
  league: LeagueInfo
}

type Props = {
  side: "a" | "b"
  current: ComparePlayer | null
  otherSlug: string | null
}

const SOURCE_LABEL: Record<string, string> = {
  nba: "NBA",
  euroleague: "EuroLeague",
  acb: "ACB",
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

export function CompareSearch({ side, current, otherSlug }: Props) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState("")
  const [activeIndex, setActiveIndex] = useState(0)
  const [results, setResults] = useState<CompareChoice[]>([])
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [anchorRect, setAnchorRect] = useState<{
    top: number
    left: number
    width: number
  } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const requestIdRef = useRef(0)
  const listboxId = useId()

  useEffect(() => {
    setMounted(true)
  }, [])

  const updateAnchor = useCallback(() => {
    const el = buttonRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    setAnchorRect({ top: r.bottom + 8, left: r.left, width: r.width })
  }, [])

  useEffect(() => {
    if (!open) return
    updateAnchor()
    function onScroll() {
      updateAnchor()
    }
    function onResize() {
      updateAnchor()
    }
    window.addEventListener("scroll", onScroll, true)
    window.addEventListener("resize", onResize)
    return () => {
      window.removeEventListener("scroll", onScroll, true)
      window.removeEventListener("resize", onResize)
    }
  }, [open, updateAnchor])

  const fetchResults = useCallback(
    async (term: string) => {
      const myReq = ++requestIdRef.current
      abortRef.current?.abort()
      const ctl = new AbortController()
      abortRef.current = ctl
      setLoading(true)
      try {
        const params = new URLSearchParams()
        if (term) params.set("q", term)
        params.set("limit", "16")
        const r = await fetch(
          `/api/compare/players/search?${params.toString()}`,
          { signal: ctl.signal },
        )
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        const data: { results: CompareChoice[] } = await r.json()
        if (myReq !== requestIdRef.current) return
        const filtered = (data.results ?? []).filter(
          (o) => o.slug !== otherSlug,
        )
        setResults(filtered)
        setActiveIndex(0)
      } catch (e: unknown) {
        if (e instanceof Error && e.name === "AbortError") return
        if (myReq !== requestIdRef.current) return
        setResults([])
      } finally {
        if (myReq === requestIdRef.current) setLoading(false)
      }
    },
    [otherSlug],
  )

  useEffect(() => {
    if (!open) return
    const handle = setTimeout(() => {
      void fetchResults(q)
    }, 180)
    return () => clearTimeout(handle)
  }, [q, open, fetchResults])

  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      const target = e.target as Node
      if (containerRef.current?.contains(target)) return
      if (listRef.current?.contains(target)) return
      setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault()
        setOpen(false)
        return
      }
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setActiveIndex((i) => Math.min(i + 1, results.length - 1))
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setActiveIndex((i) => Math.max(i - 1, 0))
      } else if (e.key === "Enter") {
        const opt = results[activeIndex]
        if (opt) {
          e.preventDefault()
          pick(opt.slug)
        }
      }
    }
    document.addEventListener("mousedown", onDown)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onDown)
      document.removeEventListener("keydown", onKey)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, results, activeIndex])

  useEffect(() => {
    if (!open || !listRef.current) return
    const el = listRef.current.querySelector<HTMLElement>(
      `[data-index="${activeIndex}"]`,
    )
    el?.scrollIntoView({ block: "nearest" })
  }, [activeIndex, open])

  function pick(slug: string) {
    const params = new URLSearchParams()
    if (side === "a") {
      params.set("a", slug)
      if (otherSlug) params.set("b", otherSlug)
    } else {
      if (otherSlug) params.set("a", otherSlug)
      params.set("b", slug)
    }
    setQ("")
    setOpen(false)
    startTransition(() => {
      router.replace(`/compare?${params.toString()}`)
    })
  }

  const placeholder = useMemo(
    () => (current ? "Search to swap…" : "Search by name, team or position…"),
    [current],
  )

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => {
          if (open) {
            setOpen(false)
            return
          }
          const el = buttonRef.current
          if (el) {
            const r = el.getBoundingClientRect()
            setAnchorRect({ top: r.bottom + 8, left: r.left, width: r.width })
          }
          setOpen(true)
          requestAnimationFrame(() => inputRef.current?.focus())
        }}
        className="group flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-3 text-left transition hover:border-brand-500/40 hover:bg-white/[0.05]"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-court-800 ring-1 ring-white/5">
          <SmartImage
            src={current?.imageUrl}
            alt={current?.fullName ?? `Player ${side === "a" ? "A" : "B"}`}
            fit="cover"
            fallbackClassName="text-sm font-bold text-brand-300"
            fallback={
              current ? getInitials(current.fullName) : side === "a" ? "A" : "B"
            }
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-ink-400">
            Player {side === "a" ? "A" : "B"}
          </p>
          <p className="truncate font-semibold text-ink-50">
            {current?.fullName ?? "Select a player"}
          </p>
          <p className="truncate text-xs text-ink-400">
            {current
              ? `${current.team?.name ?? "Free agent"}${
                  current.position ? ` · ${current.position}` : ""
                } · ${SOURCE_LABEL[current.league?.slug ?? ""] ?? current.league?.name ?? ""}`
              : "Click to choose from the database"}
          </p>
        </div>
        <span
          aria-hidden
          className="ml-2 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/5 text-ink-300 transition group-hover:border-brand-500/40 group-hover:text-brand-200"
        >
          <svg
            className={`h-3.5 w-3.5 transition-transform ${
              open ? "rotate-180" : ""
            }`}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m6 9 6 6 6-6"
            />
          </svg>
        </span>
      </button>

      {current ? (
        <Link
          href={`/players/${current.slug}`}
          onClick={(e) => e.stopPropagation()}
          className="pointer-events-none absolute -top-2 -right-2 z-10 rounded-full border border-white/10 bg-ink-900 p-1.5 text-ink-300 opacity-0 transition hover:border-brand-500/40 hover:text-brand-200 group-hover:pointer-events-auto group-hover:opacity-100"
          aria-label={`Open ${current.fullName} profile`}
          title="Open profile"
        >
          <svg
            className="h-3 w-3"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5M7.5 16.5 21 3m0 0h-5.25M21 3v5.25"
            />
          </svg>
        </Link>
      ) : null}

      {mounted && open && anchorRect
        ? createPortal(
            <AnimatePresence>
              <motion.div
                key="dropdown"
                initial={{ opacity: 0, y: -4, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.98 }}
                transition={{ duration: 0.12, ease: "easeOut" }}
                style={{
                  position: "fixed",
                  top: anchorRect.top,
                  left: anchorRect.left,
                  width: anchorRect.width,
                  zIndex: 60,
                }}
                className="overflow-hidden rounded-xl border border-white/10 bg-ink-900/95 shadow-[var(--shadow-court)] backdrop-blur"
              >
                <div className="border-b border-white/5 p-3">
                  <div className="relative">
                    <svg
                      aria-hidden
                      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
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
                    <input
                      ref={inputRef}
                      type="search"
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      placeholder={placeholder}
                      role="combobox"
                      aria-expanded
                      aria-controls={listboxId}
                      aria-autocomplete="list"
                      className="w-full rounded-md border border-white/10 bg-white/5 py-2 pl-9 pr-3 text-sm text-ink-50 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/40"
                    />
                    {q ? (
                      <button
                        type="button"
                        onClick={() => {
                          setQ("")
                          inputRef.current?.focus()
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-ink-400 transition hover:text-ink-100"
                        aria-label="Clear search"
                      >
                        <svg
                          className="h-3.5 w-3.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="2"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6 18 18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    ) : null}
                  </div>
                  <p className="mt-2 text-[10px] uppercase tracking-widest text-ink-500">
                    {loading
                      ? "Searching…"
                      : `${results.length} result${results.length === 1 ? "" : "s"}`}{" "}
                    · ↑ ↓ to move · Enter to pick · Esc to close
                  </p>
                </div>

                <div
                  ref={listRef}
                  id={listboxId}
                  role="listbox"
                  className="max-h-80 overflow-y-auto p-1.5"
                >
                  {loading && results.length === 0 ? (
                    <ul className="space-y-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <li
                          key={i}
                          className="flex items-center gap-3 rounded-md px-2 py-2"
                        >
                          <span className="h-9 w-9 shrink-0 animate-pulse rounded-md bg-white/5" />
                          <span className="flex-1 space-y-1.5">
                            <span className="block h-2.5 w-1/3 animate-pulse rounded bg-white/5" />
                            <span className="block h-2 w-1/2 animate-pulse rounded bg-white/5" />
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : results.length === 0 ? (
                    <div className="px-3 py-8 text-center">
                      <p className="text-sm text-ink-200">
                        {q ? `No players match “${q}”` : "No players available"}
                      </p>
                      <p className="mt-1 text-xs text-ink-400">
                        {q
                          ? "Try a different name, team or position."
                          : "Type to search across every league."}
                      </p>
                    </div>
                  ) : (
                    <ul className="space-y-0.5">
                      {results.map((o, idx) => {
                        const active = idx === activeIndex
                        return (
                          <li key={o.id} data-index={idx}>
                            <button
                              type="button"
                              onClick={() => pick(o.slug)}
                              onMouseMove={() => setActiveIndex(idx)}
                              role="option"
                              aria-selected={active}
                              className={`flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left text-sm transition ${
                                active
                                  ? "bg-brand-500/15 text-ink-50 ring-1 ring-brand-500/30"
                                  : "text-ink-100 hover:bg-white/5"
                              }`}
                            >
                              <span className="h-9 w-9 shrink-0 overflow-hidden rounded-md bg-court-800 ring-1 ring-white/5">
                                <SmartImage
                                  src={o.imageUrl}
                                  alt={o.fullName}
                                  fit="cover"
                                  fallbackClassName="text-[10px] font-bold text-brand-300"
                                  fallback={getInitials(o.fullName)}
                                />
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block truncate font-medium">
                                  {o.fullName}
                                </span>
                                <span className="block truncate text-xs text-ink-400">
                                  {o.team?.name ?? "Free agent"}
                                  {o.position ? ` · ${o.position}` : ""}
                                </span>
                              </span>
                              <span className="hidden shrink-0 rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-widest text-ink-300 sm:inline">
                                {SOURCE_LABEL[o.league.slug] ?? o.league.name}
                              </span>
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>,
            document.body,
          )
        : null}
    </div>
  )
}
