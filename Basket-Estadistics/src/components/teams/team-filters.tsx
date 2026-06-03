"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useTransition } from "react"

const LEAGUES = [
  { slug: "nba", name: "NBA" },
  { slug: "euroleague", name: "EuroLeague" },
  { slug: "acb", name: "ACB" },
]

const SORTS = [
  { value: "name", label: "Name (A-Z)" },
  { value: "players", label: "Roster size" },
  { value: "wins", label: "Wins" },
  { value: "netRtg", label: "Net rating" },
]

export function TeamFilters() {
  const router = useRouter()
  const search = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const league = search.get("league") ?? ""
  const sort = search.get("sort") ?? "name"
  const order = search.get("order") ?? "asc"

  function apply(updates: Record<string, string | null>) {
    const params = new URLSearchParams(search.toString())
    for (const [k, v] of Object.entries(updates)) {
      if (v === null || v === "") params.delete(k)
      else params.set(k, v)
    }
    params.delete("page")
    startTransition(() => {
      router.replace(`/teams?${params.toString()}`)
    })
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <div className="-mx-4 flex items-center gap-2 overflow-x-auto px-4 pb-0.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:flex-wrap sm:px-0">
        <button
          type="button"
          onClick={() => apply({ league: null })}
          className={`shrink-0 rounded-md border px-2.5 py-1.5 text-[11px] font-semibold transition sm:px-3 sm:text-xs ${
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
            className={`shrink-0 rounded-md border px-2.5 py-1.5 text-[11px] font-semibold transition sm:px-3 sm:text-xs ${
              league === l.slug
                ? "border-brand-400 bg-brand-500/10 text-brand-200"
                : "border-white/10 bg-white/5 text-ink-200 hover:border-white/20"
            }`}
          >
            {l.name}
          </button>
        ))}
      </div>
      <div className="flex shrink-0 gap-2">
        <select
          aria-label="Sort by"
          value={sort}
          onChange={(e) => apply({ sort: e.target.value })}
          className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-[11px] text-ink-100 outline-none focus:border-brand-400 sm:text-xs"
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
          className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-[11px] text-ink-200 transition hover:border-white/20 sm:text-xs"
          aria-label="Toggle sort order"
        >
          {order === "asc" ? "↑" : "↓"}
        </button>
      </div>
      {isPending ? (
        <span className="text-[11px] text-ink-400 sm:text-xs">Updating…</span>
      ) : null}
    </div>
  )
}
