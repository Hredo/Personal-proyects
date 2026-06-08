"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useTransition } from "react"

const LEAGUES = [
  { slug: "", label: "All" },
  { slug: "nba", label: "NBA" },
  { slug: "euroleague", label: "EuroLeague" },
  { slug: "acb", label: "ACB" },
  { slug: "leb-oro", label: "LEB Oro" },
  { slug: "leb-plata", label: "LEB Plata" },
  { slug: "eba", label: "EBA" },
] as const

const SORTS_PLAYERS = [
  { value: "points", label: "Points" },
  { value: "rebounds", label: "Rebounds" },
  { value: "assists", label: "Assists" },
  { value: "name", label: "Name" },
] as const

const SORTS_TEAMS = [
  { value: "name", label: "Name" },
  { value: "players", label: "Roster size" },
] as const

const ROLES = [
  { value: "", label: "All" },
  { value: "head_coach", label: "Head coach" },
  { value: "assistant_coach", label: "Assistant" },
  { value: "staff", label: "Staff" },
] as const

type Props = {
  basePath: string
  kind: "players" | "teams" | "coaches"
  total: number
  showing: number
}

export function DirectoryControls({ basePath, kind, total, showing }: Props) {
  return (
    <Suspense
      fallback={
        <div className="h-12 w-full animate-pulse rounded-full bg-white/[0.03]" />
      }
    >
      <DirectoryControlsInner
        basePath={basePath}
        kind={kind}
        total={total}
        showing={showing}
      />
    </Suspense>
  )
}

function DirectoryControlsInner({ basePath, kind, total, showing }: Props) {
  const router = useRouter()
  const search = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const urlLeague = search.get("league") ?? ""
  const urlSort = search.get("sort") ?? defaultSort(kind)
  const urlOrder = search.get("order") ?? "desc"
  const urlRole = search.get("role") ?? ""
  const q = search.get("q") ?? ""

  const sorts = kind === "teams" ? SORTS_TEAMS : SORTS_PLAYERS

  function apply(updates: Record<string, string | null>) {
    const params = new URLSearchParams(search.toString())
    for (const [k, v] of Object.entries(updates)) {
      if (v === null || v === "") params.delete(k)
      else params.set(k, v)
    }
    params.delete("page")
    const qs = params.toString()
    startTransition(() => {
      router.replace(qs ? `${basePath}?${qs}` : basePath, { scroll: false })
    })
  }

  return (
    <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:gap-3">
      <div className="relative lg:flex-1">
        <svg
          aria-hidden
          className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
          viewBox="0 0 24 24"
          fill="none"
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
          defaultValue={q}
          key={q}
          onChange={(e) => apply({ q: e.target.value || null })}
          placeholder={
            kind === "players"
              ? "Search players…"
              : kind === "teams"
                ? "Search teams…"
                : "Search coaches…"
          }
          aria-label="Search"
          className="h-11 w-full rounded-full border border-hairline bg-white/[0.03] pl-11 pr-4 text-sm text-ink-50 outline-none transition duration-200 placeholder:text-ink-400 focus:border-brand-400/50 focus:bg-white/[0.06] focus:ring-2 focus:ring-brand-500/20"
        />
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {LEAGUES.map((l) => {
          const active = urlLeague === l.slug
          return (
            <button
              key={l.slug || "all"}
              type="button"
              onClick={() => apply({ league: l.slug || null })}
              aria-pressed={active}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors duration-200 ${
                active
                  ? "border-brand-500 bg-brand-500 text-ink-950"
                  : "border-hairline bg-white/[0.02] text-ink-300 hover:border-hairline-strong hover:text-ink-50"
              }`}
            >
              {l.label}
            </button>
          )
        })}
      </div>

      {kind === "coaches" ? (
        <div className="flex flex-wrap items-center gap-1.5">
          {ROLES.map((r) => {
            const active = urlRole === r.value
            return (
              <button
                key={r.value || "all"}
                type="button"
                onClick={() => apply({ role: r.value || null })}
                aria-pressed={active}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors duration-200 ${
                  active
                    ? "border-brand-500 bg-brand-500 text-ink-950"
                    : "border-hairline bg-white/[0.02] text-ink-300 hover:border-hairline-strong hover:text-ink-50"
                }`}
              >
                {r.label}
              </button>
            )
          })}
        </div>
      ) : null}

      <div className="flex items-center gap-2 lg:ml-auto">
        <div className="relative">
          <select
            aria-label="Sort by"
            value={urlSort}
            onChange={(e) => apply({ sort: e.target.value })}
            className="h-11 appearance-none rounded-full border border-hairline bg-white/[0.03] pl-4 pr-9 text-xs font-semibold text-ink-100 outline-none transition duration-200 hover:border-hairline-strong focus:border-brand-400/50"
          >
            {sorts.map((s) => (
              <option key={s.value} value={s.value}>
                Sort: {s.label}
              </option>
            ))}
          </select>
          <svg
            aria-hidden
            className="pointer-events-none absolute right-3.5 top-1/2 h-3 w-3 -translate-y-1/2 text-ink-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>
        {kind !== "coaches" ? (
          <button
            type="button"
            onClick={() =>
              apply({ order: urlOrder === "asc" ? "desc" : "asc" })
            }
            aria-label={`Sort ${urlOrder === "asc" ? "descending" : "ascending"}`}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-hairline bg-white/[0.03] text-ink-200 transition-colors duration-200 hover:border-hairline-strong hover:text-ink-50"
          >
            <svg
              aria-hidden
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`h-4 w-4 transition-transform duration-300 ease-fluid ${urlOrder === "asc" ? "rotate-180" : ""}`}
            >
              <path d="M12 5v14M5 12l7 7 7-7" />
            </svg>
          </button>
        ) : null}
      </div>

      <p
        className={`font-mono text-[10px] uppercase tracking-[0.16em] text-ink-500 lg:hidden ${
          isPending ? "text-brand-300" : ""
        }`}
      >
        {showing.toLocaleString("en-US")} / {total.toLocaleString("en-US")}
      </p>
    </div>
  )
}

function defaultSort(kind: Props["kind"]): string {
  if (kind === "teams") return "name"
  if (kind === "coaches") return "name"
  return "points"
}
