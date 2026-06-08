import type { Metadata } from "next"
import { listTeams, type ListTeamsInput } from "@/lib/data/teams"
import { DirectoryControls } from "@/components/ui/directory-controls"
import { TeamsInfiniteView } from "@/components/teams/teams-infinite-view"
import { DirectoryHero } from "@/components/ui/directory-hero"

type SearchParams = Partial<Record<keyof ListTeamsInput | "q" | "page", string>>

export const revalidate = 300

export const metadata: Metadata = {
  title: "Teams",
  description:
    "Browse every team across all covered leagues. Filter by league, sort by name or roster size and open the full roster and staff with a click.",
}

const SORT_VALUES = new Set(["name", "players"])
const ORDER_VALUES = new Set(["asc", "desc"])
const LEAGUE_VALUES = new Set([
  "nba",
  "euroleague",
  "acb",
  "leb-oro",
  "leb-plata",
  "eba",
])
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
    <div className="pb-10 sm:pb-14">
      <DirectoryHero
        eyebrow="Directory · Teams"
        title="Teams"
        description="Every club across the NBA, EuroLeague, ACB and Spain's FEB ladder — open any crest for its full roster and staff."
        stats={[
          {
            value: result.total.toLocaleString("en-US"),
            label: "Teams covered",
          },
          { value: "6", label: "Leagues" },
        ]}
      />

      <div className="sticky top-[68px] z-30 -mx-4 mb-7 mt-7 px-4 py-3 sm:-mx-6 sm:px-6">
        <div className="gh-glass rounded-2xl px-3 py-2.5 sm:px-4">
          <DirectoryControls
            basePath="/teams"
            kind="teams"
            total={result.total}
            showing={result.items.length}
          />
        </div>
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
