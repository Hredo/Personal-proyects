import type { Metadata } from "next"
import { listPlayers, type ListPlayersInput } from "@/lib/data/players"
import { DirectoryControls } from "@/components/ui/directory-controls"
import { PlayersInfiniteView } from "@/components/players/players-infinite-view"

type SearchParams = Partial<
  Record<keyof ListPlayersInput | "q" | "page", string>
>

export const revalidate = 300

export const metadata: Metadata = {
  title: "Players",
  description:
    "Browse every player across the NBA, EuroLeague and Liga ACB. Filter by league, sort by points/rebounds/assists and dig into advanced profiles.",
}

const SORT_VALUES = new Set(["points", "rebounds", "assists", "name"])
const ORDER_VALUES = new Set(["asc", "desc"])
const LEAGUE_VALUES = new Set(["nba", "euroleague", "acb"])
const PAGE_SIZE = 30

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
    sort:
      sort && SORT_VALUES.has(sort)
        ? (sort as ListPlayersInput["sort"])
        : "points",
    order:
      order && ORDER_VALUES.has(order)
        ? (order as ListPlayersInput["order"])
        : "desc",
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

  return (
    <div className="py-10 sm:py-14">
      <header className="mb-8 sm:mb-10">
        <p className="text-xs uppercase tracking-widest text-brand-300 sm:text-sm">
          Directory
        </p>
        <h1 className="mt-2 font-display text-4xl font-bold text-ink-50 sm:text-5xl md:text-6xl">
          Players
        </h1>
        <p className="mt-3 max-w-xl text-sm text-ink-300 sm:text-base">
          <span className="font-mono font-semibold text-ink-100">
            {result.total.toLocaleString("en-US")}
          </span>{" "}
          player{result.total === 1 ? "" : "s"} across the NBA, EuroLeague and
          Liga ACB.
        </p>
      </header>

      <div className="mb-8">
        <DirectoryControls
          basePath="/players"
          kind="players"
          total={result.total}
          showing={result.items.length}
        />
      </div>

      <PlayersInfiniteView
        key={`${input.query ?? ""}|${input.league ?? ""}|${input.sort ?? "points"}|${input.order ?? "desc"}`}
        initial={result}
        query={input.query ?? ""}
        league={input.league ?? ""}
        sort={input.sort ?? "points"}
        order={input.order ?? "desc"}
      />
    </div>
  )
}
