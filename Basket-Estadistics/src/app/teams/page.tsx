import type { Metadata } from "next"
import { listTeams, type ListTeamsInput } from "@/lib/data/teams"
import { TeamCard } from "@/components/teams/team-card"
import { TeamFilters } from "@/components/teams/team-filters"
import { Pagination } from "@/components/ui/pagination"

type SearchParams = Partial<Record<keyof ListTeamsInput | "q" | "page", string>>

export const metadata: Metadata = {
  title: "Teams",
  description:
    "Browse every team across the NBA, EuroLeague and Liga ACB. Filter by league, sort by name, wins or net rating and open the full roster with a click.",
}

const SORT_VALUES = new Set(["name", "players", "wins", "netRtg"])
const ORDER_VALUES = new Set(["asc", "desc"])
const LEAGUE_VALUES = new Set(["nba", "euroleague", "acb"])
const PAGE_SIZE = 18

function parseInput(sp: SearchParams): ListTeamsInput {
  const sort = sp.sort
  const order = sp.order
  const league = sp.league
  const q = sp.q?.trim()
  const page = Number(sp.page ?? 1)
  return {
    query: q || undefined,
    league: league && LEAGUE_VALUES.has(league) ? league : undefined,
    sort:
      sort && SORT_VALUES.has(sort) ? (sort as ListTeamsInput["sort"]) : "name",
    order:
      order && ORDER_VALUES.has(order)
        ? (order as ListTeamsInput["order"])
        : "asc",
    page: Number.isFinite(page) && page > 0 ? Math.floor(page) : 1,
    pageSize: PAGE_SIZE,
  }
}

export default async function TeamsPage(props: {
  searchParams: Promise<SearchParams>
}) {
  const sp = await props.searchParams
  const input = parseInput(sp)
  const result = await listTeams(input)
  const { items, total, page, totalPages, pageSize } = result

  const filterSearchParams: Record<string, string | undefined> = {
    sort: sp.sort,
    order: sp.order,
    league: sp.league,
    q: sp.q,
  }

  return (
    <div className="py-8 sm:py-12">
      <header className="mb-6 sm:mb-8">
        <p className="text-xs uppercase tracking-widest text-brand-300 sm:text-sm">
          Directory
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold text-ink-50 sm:text-4xl md:text-5xl">
          Team <span className="text-gradient-brand">rosters</span>
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-ink-300 sm:text-base">
          <span className="font-mono font-semibold text-ink-100">
            {total.toLocaleString("en-US")}
          </span>{" "}
          team{total === 1 ? "" : "s"} across the NBA, EuroLeague and Liga ACB.
          Filter by league, sort by name, wins or net rating, and click any team
          to see its full roster and season stats.
        </p>
      </header>

      <div className="mb-6">
        <TeamFilters />
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center sm:p-12">
          <p className="text-sm text-ink-200 sm:text-base">
            No teams match your filters.
          </p>
          <p className="mt-1 text-xs text-ink-400 sm:text-sm">
            Try a different league or a partial name.
          </p>
        </div>
      ) : (
        <>
          <ul className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
            {items.map((t, idx) => (
              <li key={t.id}>
                <TeamCard team={t} index={idx} />
              </li>
            ))}
          </ul>

          <div className="mt-6 sm:mt-8">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              total={total}
              pageSize={pageSize}
              basePath="/teams"
              searchParams={filterSearchParams}
            />
          </div>
        </>
      )}
    </div>
  )
}
