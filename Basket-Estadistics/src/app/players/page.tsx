import type { Metadata } from "next"
import { listPlayers, type ListPlayersInput } from "@/lib/data/players"
import { PlayerCard } from "@/components/players/player-card"
import { PlayerFilters } from "@/components/players/player-filters"

type SearchParams = Partial<Record<keyof ListPlayersInput | "q", string>>

export const metadata: Metadata = {
  title: "Players",
  description:
    "Browse every player across the NBA, EuroLeague and Liga ACB. Filter by league, sort by points/rebounds/assists and dig into advanced profiles.",
}

const SORT_VALUES = new Set(["points", "rebounds", "assists", "name"])
const ORDER_VALUES = new Set(["asc", "desc"])
const LEAGUE_VALUES = new Set(["nba", "euroleague", "acb"])

function parseInput(sp: SearchParams): ListPlayersInput {
  const sort = sp.sort
  const order = sp.order
  const league = sp.league
  const team = sp.team?.trim()
  const q = sp.q?.trim()
  return {
    query: q || undefined,
    league: league && LEAGUE_VALUES.has(league) ? league : undefined,
    team: team || undefined,
    sort: sort && SORT_VALUES.has(sort) ? (sort as ListPlayersInput["sort"]) : "points",
    order: order && ORDER_VALUES.has(order) ? (order as ListPlayersInput["order"]) : "desc",
    limit: 200,
  }
}

export default async function PlayersPage(props: {
  searchParams: Promise<SearchParams>
}) {
  const sp = await props.searchParams
  const input = parseInput(sp)
  const players = await listPlayers(input)

  return (
    <div className="py-12">
      <header className="mb-8">
        <p className="text-sm uppercase tracking-widest text-brand-300">Directory</p>
        <h1 className="mt-2 font-display text-4xl font-bold text-ink-50 sm:text-5xl">
          Player <span className="text-gradient-brand">intelligence</span>
        </h1>
        <p className="mt-3 max-w-2xl text-ink-300">
          {players.length} player{players.length === 1 ? "" : "s"} across the NBA,
          EuroLeague and Liga ACB. Filter by league, sort by stat and click any
          player to open a full profile with shot splits, advanced analytics and
          personalised highlight reels.
        </p>
      </header>

      <div className="mb-6">
        <PlayerFilters />
      </div>

      {players.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-12 text-center">
          <p className="text-ink-200">No players match your filters.</p>
          <p className="mt-1 text-sm text-ink-400">
            Try a different league or a partial name.
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {players.map((p, idx) => (
            <li key={p.id}>
              <PlayerCard player={p} index={idx} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
