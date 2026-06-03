import type { Metadata } from "next"
import { listPlayers, type ListPlayersInput } from "@/lib/data/players"
import { PlayerCard } from "@/components/players/player-card"
import { PlayerFilters } from "@/components/players/player-filters"
import { Pagination } from "@/components/ui/pagination"

type SearchParams = Partial<Record<keyof ListPlayersInput | "q" | "page", string>>

export const metadata: Metadata = {
  title: "Players",
  description:
    "Browse every player across the NBA, EuroLeague and Liga ACB. Filter by league, sort by points/rebounds/assists and dig into advanced profiles.",
}

const SORT_VALUES = new Set(["points", "rebounds", "assists", "name"])
const ORDER_VALUES = new Set(["asc", "desc"])
const LEAGUE_VALUES = new Set(["nba", "euroleague", "acb"])
const PAGE_SIZE = 24

function parseInput(sp: SearchParams): ListPlayersInput {
  const sort = sp.sort
  const order = sp.order
  const league = sp.league
  const team = sp.team?.trim()
  const q = sp.q?.trim()
  const page = Number(sp.page ?? 1)
  return {
    query: q || undefined,
    league: league && LEAGUE_VALUES.has(league) ? league : undefined,
    team: team || undefined,
    sort: sort && SORT_VALUES.has(sort) ? (sort as ListPlayersInput["sort"]) : "points",
    order: order && ORDER_VALUES.has(order) ? (order as ListPlayersInput["order"]) : "desc",
    page: Number.isFinite(page) && page > 0 ? Math.floor(page) : 1,
    pageSize: PAGE_SIZE,
  }
}

export default async function PlayersPage(props: {
  searchParams: Promise<SearchParams>
}) {
  const sp = await props.searchParams
  const input = parseInput(sp)
  const result = await listPlayers(input)
  const { items, total, page, totalPages, pageSize } = result

  const filterSearchParams: Record<string, string | undefined> = {
    sort: sp.sort,
    order: sp.order,
    league: sp.league,
    team: sp.team,
    q: sp.q,
  }

  return (
    <div className="py-8 sm:py-12">
      <header className="mb-6 sm:mb-8">
        <p className="text-xs uppercase tracking-widest text-brand-300 sm:text-sm">
          Directory
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold text-ink-50 sm:text-4xl md:text-5xl">
          Player <span className="text-gradient-brand">intelligence</span>
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-ink-300 sm:text-base">
          <span className="font-mono font-semibold text-ink-100">
            {total.toLocaleString("en-US")}
          </span>{" "}
          player{total === 1 ? "" : "s"} across the NBA, EuroLeague and Liga ACB.
          Filter by league, sort by stat and click any player to open a full
          profile with shot splits, advanced analytics and personalised highlight
          reels.
        </p>
      </header>

      <div className="mb-6">
        <PlayerFilters />
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center sm:p-12">
          <p className="text-sm text-ink-200 sm:text-base">
            No players match your filters.
          </p>
          <p className="mt-1 text-xs text-ink-400 sm:text-sm">
            Try a different league or a partial name.
          </p>
        </div>
      ) : (
        <>
          <ul className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
            {items.map((p, idx) => (
              <li key={p.id}>
                <PlayerCard player={p} index={idx} />
              </li>
            ))}
          </ul>

          <div className="mt-6 sm:mt-8">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              total={total}
              pageSize={pageSize}
              basePath="/players"
              searchParams={filterSearchParams}
            />
          </div>
        </>
      )}
    </div>
  )
}
