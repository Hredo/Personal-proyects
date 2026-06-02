"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect, useTransition } from "react"

const LEAGUES = [
  { slug: "nba", name: "NBA" },
  { slug: "euroleague", name: "EuroLeague" },
  { slug: "acb", name: "ACB" },
]

const SORTS = [
  { value: "name", label: "Name (A-Z)" },
  { value: "players", label: "Roster size" },
]

export function TeamFilters() {
  const router = useRouter()
  const search = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const [q, setQ] = useState(search.get("q") ?? "")
  const league = search.get("league") ?? ""
  const sort = search.get("sort") ?? "name"
  const order = search.get("order") ?? "asc"

  useEffect(() => {
    setQ(search.get("q") ?? "")
  }, [search])

  function apply(updates: Record<string, string | null>) {
    const params = new URLSearchParams(search.toString())
    for (const [k, v] of Object.entries(updates)) {
      if (v === null || v === "") params.delete(k)
      else params.set(k, v)
    }
    startTransition(() => {
      router.replace(`/teams?${params.toString()}`)
    })
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <input
          type="search"
          placeholder="Search by team name…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") apply({ q: q.trim() || null })
          }}
          onBlur={() => apply({ q: q.trim() || null })}
          className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 pl-9 text-sm text-ink-50 outline-none ring-brand-500/50 transition focus:border-brand-400 focus:ring-2"
        />
        <svg
          aria-hidden
          className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-ink-400"
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
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => apply({ league: null })}
          className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition ${
            !league
              ? "border-brand-400 bg-brand-500/10 text-brand-200"
              : "border-white/10 bg-white/5 text-ink-200 hover:border-white/20"
          }`}
        >
          All leagues
        </button>
        {LEAGUES.map((l) => (
          <button
            key={l.slug}
            type="button"
            onClick={() => apply({ league: league === l.slug ? null : l.slug })}
            className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition ${
              league === l.slug
                ? "border-brand-400 bg-brand-500/10 text-brand-200"
                : "border-white/10 bg-white/5 text-ink-200 hover:border-white/20"
            }`}
          >
            {l.name}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <select
          aria-label="Sort by"
          value={sort}
          onChange={(e) => apply({ sort: e.target.value })}
          className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-xs text-ink-100 outline-none focus:border-brand-400"
        >
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => apply({ order: order === "asc" ? "desc" : "asc" })}
          className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-xs text-ink-200 transition hover:border-white/20"
          aria-label="Toggle sort order"
        >
          {order === "asc" ? "↑" : "↓"}
        </button>
      </div>
      {isPending ? (
        <span className="text-xs text-ink-400">Updating…</span>
      ) : null}
    </div>
  )
}
