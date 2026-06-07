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
    "Browse every player across all covered leagues. Filter by league, sort by points, rebounds or assists and dig into advanced profiles.",
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
      <header className="mb-7 sm:mb-9">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <div>
            <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-brand-300">
              <span className="h-px w-6 bg-brand-400/60" />
              Directory
            </p>
            <h1 className="mt-3 font-display text-5xl font-bold leading-[0.95] tracking-[-0.02em] text-ink-50 sm:text-6xl md:text-7xl">
              Players
            </h1>
          </div>
          <p className="max-w-xs text-sm leading-relaxed text-ink-300">
            <span className="font-display text-2xl font-bold tabular-nums text-ink-50">
              {result.total.toLocaleString("en-US")}
            </span>{" "}
            player{result.total === 1 ? "" : "s"} indexed across every covered
            league — searchable and rankable in one place.
          </p>
        </div>
      </header>

      <div className="sticky top-[68px] z-30 -mx-4 mb-7 px-4 py-3 sm:top-[76px] sm:-mx-6 sm:px-6">
        <div className="gh-glass rounded-2xl px-3 py-2.5 sm:px-4">
          <DirectoryControls
            basePath="/players"
            kind="players"
            total={result.total}
            showing={result.items.length}
          />
        </div>
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
