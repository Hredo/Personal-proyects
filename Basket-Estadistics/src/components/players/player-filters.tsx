"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useTransition } from "react"

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
      <div className="h-11 w-72 animate-pulse rounded-xl bg-white/5" />
      <div className="h-11 w-40 animate-pulse rounded-xl bg-white/5" />
    </div>
  )
}

function PlayerFiltersInner() {
  const router = useRouter()
  const search = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const urlLeague = search.get("league") ?? ""
  const urlSort = search.get("sort") ?? "points"
  const urlOrder = search.get("order") ?? "desc"

  function apply(updates: Record<string, string | null>) {
    const params = new URLSearchParams(search.toString())
    for (const [k, v] of Object.entries(updates)) {
      if (v === null || v === "") params.delete(k)
      else params.set(k, v)
    }
    params.delete("page")
    const qs = params.toString()
    startTransition(() => {
      router.replace(qs ? `/players?${qs}` : "/players", { scroll: false })
    })
  }

  return (
    <div className="space-y-3">
      <div className="-mx-4 flex items-center gap-2 overflow-x-auto px-4 pb-0.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:justify-end sm:px-0">
        <div className="flex shrink-0 items-center gap-2">
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
                  className={`rounded-full px-2.5 py-1.5 text-[11px] font-medium transition sm:px-3 sm:text-xs ${
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
            className="shrink-0 rounded-md border border-white/10 bg-white/5 px-2.5 py-1.5 text-[11px] text-ink-200 transition hover:border-white/20 sm:text-xs"
          >
            {urlOrder === "asc" ? "↑ Asc" : "↓ Desc"}
          </button>
        </div>
      </div>

      <div className="-mx-4 flex items-center gap-2 overflow-x-auto px-4 pb-0.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:flex-wrap sm:px-0">
        {LEAGUES.map((l) => {
          const active = urlLeague === l.slug
          return (
            <button
              key={l.slug || "all"}
              type="button"
              onClick={() => apply({ league: l.slug || null })}
              className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-semibold transition sm:text-xs ${
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
          <span className="ml-1 inline-flex shrink-0 items-center gap-1.5 text-[11px] text-ink-400">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-400" />
            Updating…
          </span>
        ) : null}
      </div>
    </div>
  )
}
