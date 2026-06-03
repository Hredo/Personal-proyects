"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useTransition } from "react"

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

  const league = search.get("league") ?? ""
  const role = search.get("role") ?? ""

  function apply(updates: Record<string, string | null>) {
    const params = new URLSearchParams(search.toString())
    for (const [k, v] of Object.entries(updates)) {
      if (v === null || v === "") params.delete(k)
      else params.set(k, v)
    }
    params.delete("page")
    startTransition(() => {
      router.replace(`/coaches?${params.toString()}`)
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <label
          htmlFor="coach-role"
          className="text-[11px] uppercase tracking-widest text-ink-400 sm:text-xs"
        >
          Role
        </label>
        <select
          id="coach-role"
          aria-label="Filter by role"
          value={role}
          onChange={(e) => apply({ role: e.target.value || null })}
          className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-[11px] text-ink-100 outline-none focus:border-brand-400 sm:text-xs"
        >
          {ROLES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </div>
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
      {isPending ? (
        <span className="block text-[11px] text-ink-400 sm:text-xs">Updating…</span>
      ) : null}
    </div>
  )
}
