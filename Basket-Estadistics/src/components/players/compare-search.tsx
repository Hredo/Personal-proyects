"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react"
import { AnimatePresence, motion } from "framer-motion"
import type { CompareChoice, ComparePlayer } from "@/lib/data/compare"

type Props = {
  side: "a" | "b"
  current: ComparePlayer | null
  otherSlug: string | null
  options: CompareChoice[]
}

const SOURCE_LABEL: Record<string, string> = {
  nba: "NBA",
  euroleague: "EuroLeague",
  acb: "ACB",
}

const SOURCE_ORDER = ["nba", "euroleague", "acb"] as const

function currentSourceKey(c: ComparePlayer | null): string {
  if (!c) return ""
  return c.league?.slug ?? ""
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

export function CompareSearch({ side, current, otherSlug, options }: Props) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState("")
  const [activeIndex, setActiveIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const listboxId = useId()

  const available = useMemo(
    () => options.filter((o) => o.slug !== otherSlug),
    [options, otherSlug],
  )

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return available
    return available.filter((o) => {
      if (o.fullName.toLowerCase().includes(term)) return true
      if (o.team?.name.toLowerCase().includes(term)) return true
      if (o.position && o.position.toLowerCase().includes(term)) return true
      return false
    })
  }, [available, q])

  const flat = useMemo(() => filtered, [filtered])

  const groups = useMemo(() => {
    const map = new Map<string, CompareChoice[]>()
    for (const s of SOURCE_ORDER) map.set(s, [])
    for (const o of flat) {
      const arr = map.get(o.source) ?? []
      arr.push(o)
      map.set(o.source, arr)
    }
    return SOURCE_ORDER
      .map((s) => ({ source: s, items: map.get(s) ?? [] }))
      .filter((g) => g.items.length > 0)
  }, [flat])

  useEffect(() => {
    setActiveIndex(0)
  }, [q, open])

  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false)
        return
      }
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setActiveIndex((i) => Math.min(i + 1, flat.length - 1))
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setActiveIndex((i) => Math.max(i - 1, 0))
      } else if (e.key === "Enter") {
        const opt = flat[activeIndex]
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
  }, [open, flat, activeIndex])

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

  const flatIndexBySlug = useMemo(() => {
    const m = new Map<string, number>()
    flat.forEach((o, i) => m.set(o.slug, i))
    return m
  }, [flat])

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((o) => {
            const next = !o
            if (next) {
              requestAnimationFrame(() => inputRef.current?.focus())
            }
            return next
          })
        }}
        className="group flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-3 text-left transition hover:border-brand-500/40 hover:bg-white/[0.05]"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-court-800 ring-1 ring-white/5">
          {current?.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={current.photoUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm font-bold text-brand-300">
              {current ? getInitials(current.fullName) : side === "a" ? "A" : "B"}
            </div>
          )}
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
                } · ${
                  SOURCE_LABEL[currentSourceKey(current)] ??
                  current.league?.name ??
                  ""
                }`
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
          className="absolute -top-2 -right-2 z-10 rounded-full border border-white/10 bg-ink-900 p-1.5 text-ink-300 opacity-0 transition hover:border-brand-500/40 hover:text-brand-200 group-hover:opacity-100"
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

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.12, ease: "easeOut" }}
            className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-xl border border-white/10 bg-ink-900/95 shadow-[var(--shadow-court)] backdrop-blur"
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
                  placeholder="Search by name, team or position…"
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
                {flat.length} player{flat.length === 1 ? "" : "s"} · ↑ ↓ to
                move · Enter to pick · Esc to close
              </p>
            </div>

            <div
              ref={listRef}
              id={listboxId}
              role="listbox"
              className="max-h-80 overflow-y-auto p-1.5"
            >
              {flat.length === 0 ? (
                <div className="px-3 py-8 text-center">
                  <p className="text-sm text-ink-200">
                    No players match &ldquo;{q}&rdquo;
                  </p>
                  <p className="mt-1 text-xs text-ink-400">
                    Try a different name, team or position.
                  </p>
                </div>
              ) : (
                groups.map((g) => (
                  <div key={g.source}>
                    <p className="sticky top-0 z-10 flex items-center gap-2 bg-ink-900/95 px-2 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-widest text-ink-400 backdrop-blur">
                      <span
                        aria-hidden
                        className="h-1 w-1 rounded-full bg-brand-400"
                      />
                      {SOURCE_LABEL[g.source] ?? g.source}
                      <span className="text-ink-500">
                        ({g.items.length})
                      </span>
                    </p>
                    <ul className="space-y-0.5">
                      {g.items.map((o) => {
                        const idx = flatIndexBySlug.get(o.slug) ?? 0
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
                                {o.photoUrl ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={o.photoUrl}
                                    alt=""
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <span className="flex h-full w-full items-center justify-center text-[10px] font-bold text-brand-300">
                                    {getInitials(o.fullName)}
                                  </span>
                                )}
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
                                {SOURCE_LABEL[o.source] ?? o.source}
                              </span>
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
