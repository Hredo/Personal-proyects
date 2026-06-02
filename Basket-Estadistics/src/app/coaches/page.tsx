import type { Metadata } from "next"
import { CoachCard } from "@/components/staff/coach-card"
import { CoachFilters } from "@/components/staff/coach-filters"
import { groupCoachesByTeam, listCoaches } from "@/lib/data/staff"

type SearchParams = Record<string, string | string[] | undefined>

const LEAGUE_VALUES = new Set(["nba", "euroleague", "acb"])
const ROLE_VALUES = new Set(["head_coach", "assistant_coach", "staff"])

export const metadata: Metadata = {
  title: "Coaches & Staff",
  description:
    "Browse every head coach, assistant and staff member across the NBA, EuroLeague and Liga ACB.",
}

function firstParam(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0]
  return v
}

export default async function CoachesPage(props: {
  searchParams: Promise<SearchParams>
}) {
  const sp = await props.searchParams
  const league = firstParam(sp.league)
  const team = firstParam(sp.team)?.trim()
  const role = firstParam(sp.role)
  const query = firstParam(sp.q)?.trim()

  const coaches = await listCoaches({
    league: league && LEAGUE_VALUES.has(league) ? league : undefined,
    team: team || undefined,
    role: role && ROLE_VALUES.has(role) ? (role as "head_coach" | "assistant_coach" | "staff") : undefined,
    query: query || undefined,
  })

  const groups = groupCoachesByTeam(coaches)

  return (
    <div className="py-12">
      <header className="mb-8">
        <p className="text-sm uppercase tracking-widest text-brand-300">
          Directory
        </p>
        <h1 className="mt-2 font-display text-4xl font-bold text-ink-50 sm:text-5xl">
          Coaches &amp; <span className="text-gradient-brand">staff</span>
        </h1>
        <p className="mt-3 max-w-2xl text-ink-300">
          {coaches.length} staff member{coaches.length === 1 ? "" : "s"} across{" "}
          {groups.length} team{groups.length === 1 ? "" : "s"} in the NBA,
          EuroLeague and Liga ACB. Filter by league, team or role.
        </p>
      </header>

      <div className="mb-6">
        <CoachFilters />
      </div>

      {groups.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-12 text-center">
          <p className="text-ink-200">No staff match your filters.</p>
          <p className="mt-1 text-sm text-ink-400">
            Try a different league, role or partial name.
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {groups.map((g) => (
            <li
              key={g.team.id}
              className="rounded-xl border border-white/5 bg-white/[0.02] p-4"
            >
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-md bg-court-800 ring-1 ring-white/5">
                  {g.team.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={g.team.logoUrl}
                      alt={g.team.name}
                      className="h-full w-full object-contain p-1"
                      loading="lazy"
                    />
                  ) : (
                    <span className="text-[10px] font-bold text-brand-300">
                      {g.team.name.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-ink-50">
                    {g.team.name}
                  </p>
                  <p className="text-xs text-ink-400">{g.league.name}</p>
                </div>
                <span className="rounded-md bg-white/5 px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-ink-300">
                  {g.coaches.length}
                </span>
              </div>
              <ul className="space-y-2">
                {g.coaches.map((c) => (
                  <li key={c.id}>
                    <CoachCard coach={c} />
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
