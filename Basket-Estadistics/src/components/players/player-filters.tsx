"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useEffect, useRef, useState, useTransition } from "react"

const LEAGUES = [
  { slug: "", label: "All leagues" },
  { slug: "nba", label: "NBA" },
  { slug: "euroleague", label: "EuroLeague" },
  { slug: "acb", label: "ACB" },
] as const

const SORTS = [
  { value: "points", label: "Points" },
  { value: "rebounds", label: "Rebounds" },
  { value: "assists", label: "Assists" },
  { value: "name", label: "Name" },
] as const

export function PlayerFilters() {
  return (
    <Suspense fallback={<PlayerFiltersSkeleton />}>
      <PlayerFiltersInner />
    </Suspense>
  )
}

function PlayerFiltersSkeleton() {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
      <div className="h-11 flex-1 animate-pulse rounded-xl bg-white/5" />
      <div className="h-11 w-72 animate-pulse rounded-xl bg-white/5" />
      <div className="h-11 w-40 animate-pulse rounded-xl bg-white/5" />
    </div>
  )
}

function PlayerFiltersInner() {
  const router = useRouter()
  const search = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const urlQ = search.get("q") ?? ""
  const urlLeague = search.get("league") ?? ""
  const urlSort = search.get("sort") ?? "points"
  const urlOrder = search.get("order") ?? "desc"

  const [q, setQ] = useState(urlQ)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const firstRender = useRef(true)

  useEffect(() => {
    setQ(urlQ)
  }, [urlQ])

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      apply({ q: q.trim() || null })
    }, 220)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q])

  function apply(updates: Record<string, string | null>) {
    const params = new URLSearchParams(search.toString())
    for (const [k, v] of Object.entries(updates)) {
      if (v === null || v === "") params.delete(k)
      else params.set(k, v)
    }
    const qs = params.toString()
    startTransition(() => {
      router.replace(qs ? `/players?${qs}` : "/players", { scroll: false })
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <svg
            aria-hidden
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
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
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by player name…"
            aria-label="Search players by name"
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2.5 pl-10 pr-4 text-sm text-ink-50 placeholder:text-ink-400 outline-none ring-brand-500/50 transition focus:border-brand-400/60 focus:bg-white/[0.07] focus:ring-2"
          />
          {q ? (
            <button
              type="button"
              onClick={() => setQ("")}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-ink-400 transition hover:bg-white/5 hover:text-ink-100"
            >
              <svg
                aria-hidden
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

        <div className="flex items-center gap-2">
          <span className="hidden text-[10px] uppercase tracking-widest text-ink-400 lg:inline">
            Sort
          </span>
          <div className="flex gap-1 rounded-full border border-white/10 bg-white/[0.03] p-0.5">
            {SORTS.map((s) => {
              const active = urlSort === s.value
              return (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => apply({ sort: s.value })}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                    active
                      ? "bg-brand-500 text-ink-950"
                      : "text-ink-200 hover:text-ink-50"
                  }`}
                >
                  {s.label}
                </button>
              )
            })}
          </div>
          <button
            type="button"
            onClick={() => apply({ order: urlOrder === "asc" ? "desc" : "asc" })}
            aria-label={`Sort ${urlOrder === "asc" ? "descending" : "ascending"}`}
            className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-ink-200 transition hover:border-white/20"
          >
            {urlOrder === "asc" ? "↑ Asc" : "↓ Desc"}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {LEAGUES.map((l) => {
          const active = urlLeague === l.slug
          return (
            <button
              key={l.slug || "all"}
              type="button"
              onClick={() => apply({ league: l.slug || null })}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                active
                  ? "bg-gradient-to-r from-brand-500 to-brand-400 text-ink-950 shadow-[var(--shadow-brand-glow)]"
                  : "border border-white/10 bg-white/[0.03] text-ink-200 hover:border-white/20 hover:text-ink-50"
              }`}
            >
              {l.label}
            </button>
          )
        })}
        {isPending ? (
          <span className="ml-2 inline-flex items-center gap-1.5 text-[11px] text-ink-400">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-400" />
            Updating…
          </span>
        ) : null}
      </div>
    </div>
  )
}
