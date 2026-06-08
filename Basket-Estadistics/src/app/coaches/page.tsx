import type { Metadata } from "next"
import { DirectoryControls } from "@/components/ui/directory-controls"
import { CoachesInfiniteView } from "@/components/staff/coaches-infinite-view"
import { DirectoryHero } from "@/components/ui/directory-hero"
import { listCoaches, type ListCoachesInput } from "@/lib/data/staff"

type SearchParams = Partial<
  Record<keyof ListCoachesInput | "q" | "page", string>
>

export const revalidate = 300

export const metadata: Metadata = {
  title: "Coaches & Staff",
  description:
    "Browse every head coach, assistant and staff member across the NBA, EuroLeague and Liga ACB.",
}

const LEAGUE_VALUES = new Set([
  "nba",
  "euroleague",
  "acb",
  "leb-oro",
  "leb-plata",
  "eba",
])
const ROLE_VALUES = new Set(["head_coach", "assistant_coach", "staff"])
const PAGE_SIZE = 48

function parseInput(sp: SearchParams): ListCoachesInput {
  const league = sp.league
  const team = sp.team?.trim()
  const role = sp.role
  const query = sp.q?.trim()
  const page = Number(sp.page ?? 1)
  return {
    league: league && LEAGUE_VALUES.has(league) ? league : undefined,
    team: team || undefined,
    role:
      role && ROLE_VALUES.has(role)
        ? (role as ListCoachesInput["role"])
        : undefined,
    query: query || undefined,
    page: Number.isFinite(page) && page > 0 ? Math.floor(page) : 1,
    pageSize: PAGE_SIZE,
  }
}

export default async function CoachesPage(props: {
  searchParams: Promise<SearchParams>
}) {
  const sp = await props.searchParams
  const input = parseInput(sp)
  const result = await listCoaches(input)

  return (
    <div className="pb-10 sm:pb-14">
      <DirectoryHero
        eyebrow="Directory · Staff"
        title="Coaches"
        description="Head coaches, assistants and staff across the NBA, EuroLeague and Liga ACB — filtered by role and league."
        stats={[
          {
            value: result.total.toLocaleString("en-US"),
            label: "Staff indexed",
          },
          { value: "3", label: "Leagues" },
        ]}
      />

      <div className="sticky top-[68px] z-30 -mx-4 mb-7 mt-7 px-4 py-3 sm:-mx-6 sm:px-6">
        <div className="gh-glass rounded-2xl px-3 py-2.5 sm:px-4">
          <DirectoryControls
            basePath="/coaches"
            kind="coaches"
            total={result.total}
            showing={result.items.length}
          />
        </div>
      </div>

      <CoachesInfiniteView
        key={`${input.query ?? ""}|${input.league ?? ""}|${input.role ?? ""}`}
        initial={result}
        query={input.query ?? ""}
        league={input.league ?? ""}
        role={input.role ?? ""}
      />
    </div>
  )
}
