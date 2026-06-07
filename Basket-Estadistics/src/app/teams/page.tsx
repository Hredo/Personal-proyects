import type { Metadata } from "next"
import { listTeams, type ListTeamsInput } from "@/lib/data/teams"
import { DirectoryControls } from "@/components/ui/directory-controls"
import { TeamsInfiniteView } from "@/components/teams/teams-infinite-view"

type SearchParams = Partial<Record<keyof ListTeamsInput | "q" | "page", string>>

export const revalidate = 300

export const metadata: Metadata = {
  title: "Teams",
  description:
    "Browse every team across all covered leagues. Filter by league, sort by name or roster size and open the full roster and staff with a click.",
}

const SORT_VALUES = new Set(["name", "players"])
const ORDER_VALUES = new Set(["asc", "desc"])
const LEAGUE_VALUES = new Set(["nba", "euroleague", "acb"])
const PAGE_SIZE = 24

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

  return (
    <div className="py-10 sm:py-14">
      <header className="mb-8 sm:mb-10">
        <p className="text-xs uppercase tracking-widest text-brand-300 sm:text-sm">
          Directory
        </p>
        <h1 className="mt-2 font-display text-4xl font-bold text-ink-50 sm:text-5xl md:text-6xl">
          Teams
        </h1>
        <p className="mt-3 max-w-xl text-sm text-ink-300 sm:text-base">
          <span className="font-mono font-semibold text-ink-100">
            {result.total.toLocaleString("en-US")}
          </span>{" "}
          team{result.total === 1 ? "" : "s"} across all covered leagues.
        </p>
      </header>

      <div className="mb-8">
        <DirectoryControls
          basePath="/teams"
          kind="teams"
          total={result.total}
          showing={result.items.length}
        />
      </div>

      <TeamsInfiniteView
        key={`${input.query ?? ""}|${input.league ?? ""}|${input.sort ?? "name"}|${input.order ?? "asc"}`}
        initial={result}
        query={input.query ?? ""}
        league={input.league ?? ""}
        sort={input.sort ?? "name"}
        order={input.order ?? "asc"}
      />
    </div>
  )
}
