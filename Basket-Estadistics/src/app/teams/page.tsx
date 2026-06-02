import type { Metadata } from "next"
import { listTeams, type ListTeamsInput } from "@/lib/data/teams"
import { TeamCard } from "@/components/teams/team-card"
import { TeamFilters } from "@/components/teams/team-filters"

type SearchParams = Partial<Record<keyof ListTeamsInput | "q", string>>

export const metadata: Metadata = {
  title: "Teams",
  description:
    "Browse every team across the NBA, EuroLeague and Liga ACB. Filter by league, sort by name or roster size and open the roster with a click.",
}

const SORT_VALUES = new Set(["name", "players"])
const ORDER_VALUES = new Set(["asc", "desc"])
const LEAGUE_VALUES = new Set(["nba", "euroleague", "acb"])

function parseInput(sp: SearchParams): ListTeamsInput {
  const sort = sp.sort
  const order = sp.order
  const league = sp.league
  const q = sp.q?.trim()
  return {
    query: q || undefined,
    league: league && LEAGUE_VALUES.has(league) ? league : undefined,
    sort:
      sort && SORT_VALUES.has(sort) ? (sort as ListTeamsInput["sort"]) : "name",
    order:
      order && ORDER_VALUES.has(order)
        ? (order as ListTeamsInput["order"])
        : "asc",
    limit: 300,
  }
}

export default async function TeamsPage(props: {
  searchParams: Promise<SearchParams>
}) {
  const sp = await props.searchParams
  const input = parseInput(sp)
  const teams = await listTeams(input)

  return (
    <div className="py-12">
      <header className="mb-8">
        <p className="text-sm uppercase tracking-widest text-brand-300">
          Directory
        </p>
        <h1 className="mt-2 font-display text-4xl font-bold text-ink-50 sm:text-5xl">
          Team <span className="text-gradient-brand">rosters</span>
        </h1>
        <p className="mt-3 max-w-2xl text-ink-300">
          {teams.length} team{teams.length === 1 ? "" : "s"} across the NBA,
          EuroLeague and Liga ACB. Filter by league, sort by name or roster size
          and click any team to see its full player list.
        </p>
      </header>

      <div className="mb-6">
        <TeamFilters />
      </div>

      {teams.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-12 text-center">
          <p className="text-ink-200">No teams match your filters.</p>
          <p className="mt-1 text-sm text-ink-400">
            Try a different league or a partial name.
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {teams.map((t, idx) => (
            <li key={t.id}>
              <TeamCard team={t} index={idx} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
