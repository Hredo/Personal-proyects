import type { Metadata } from "next"
import { listPlayers, type ListPlayersInput } from "@/lib/data/players"
import { DirectoryControls } from "@/components/ui/directory-controls"
import { PlayersInfiniteView } from "@/components/players/players-infinite-view"
import { DirectoryHero } from "@/components/ui/directory-hero"
import { StickyFilterBar } from "@/components/ui/sticky-filter-bar"

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
const LEAGUE_VALUES = new Set([
  "nba",
  "euroleague",
  "acb",
  "feb",
  "leb-oro",
  "leb-plata",
  "eba",
])
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
    <div className="full-bleed relative pb-10 sm:pb-14">
      <DirectoryHero
        eyebrow="Directory · Players"
        title="Players"
        description="Every athlete across six leagues, normalized to one scale. Search, filter and rank by the numbers that matter."
        stats={[
          {
            value: result.total.toLocaleString("en-US"),
            label: "Players indexed",
          },
          { value: "6", label: "Leagues" },
        ]}
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
      <StickyFilterBar>
        <DirectoryControls
          basePath="/players"
          kind="players"
          total={result.total}
          showing={result.items.length}
        />
      </StickyFilterBar>

      <PlayersInfiniteView
        key={`${input.query ?? ""}|${input.league ?? ""}|${input.sort ?? "points"}|${input.order ?? "desc"}`}
        initial={result}
        query={input.query ?? ""}
        league={input.league ?? ""}
        sort={input.sort ?? "points"}
        order={input.order ?? "desc"}
      />
      </div>
    </div>
  )
}
