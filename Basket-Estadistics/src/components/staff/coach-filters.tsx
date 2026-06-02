"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState, useTransition } from "react"

const LEAGUES = [
  { slug: "nba", name: "NBA" },
  { slug: "euroleague", name: "EuroLeague" },
  { slug: "acb", name: "ACB" },
]

const ROLES = [
  { value: "", label: "All roles" },
  { value: "head_coach", label: "Head coach" },
  { value: "assistant_coach", label: "Assistant" },
  { value: "staff", label: "Staff" },
]

export function CoachFilters() {
  const router = useRouter()
  const search = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const [q, setQ] = useState(search.get("q") ?? "")
  const [team, setTeam] = useState(search.get("team") ?? "")
  const league = search.get("league") ?? ""
  const role = search.get("role") ?? ""

  useEffect(() => {
    setQ(search.get("q") ?? "")
    setTeam(search.get("team") ?? "")
  }, [search])

  function apply(updates: Record<string, string | null>) {
    const params = new URLSearchParams(search.toString())
    for (const [k, v] of Object.entries(updates)) {
      if (v === null || v === "") params.delete(k)
      else params.set(k, v)
    }
    startTransition(() => {
      router.replace(`/coaches?${params.toString()}`)
    })
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <input
            type="search"
            placeholder="Search by name…"
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
        <div className="relative flex-1">
          <input
            type="search"
            placeholder="Filter by team name…"
            value={team}
            onChange={(e) => setTeam(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") apply({ team: team.trim() || null })
            }}
            onBlur={() => apply({ team: team.trim() || null })}
            className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-ink-50 outline-none ring-brand-500/50 transition focus:border-brand-400 focus:ring-2"
          />
        </div>
        <select
          aria-label="Filter by role"
          value={role}
          onChange={(e) => apply({ role: e.target.value || null })}
          className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-xs text-ink-100 outline-none focus:border-brand-400"
        >
          {ROLES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
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
      {isPending ? (
        <span className="text-xs text-ink-400">Updating…</span>
      ) : null}
    </div>
  )
}
