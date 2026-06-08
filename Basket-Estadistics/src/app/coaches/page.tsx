import type { Metadata } from "next"
import { DirectoryControls } from "@/components/ui/directory-controls"
import { CoachesInfiniteView } from "@/components/staff/coaches-infinite-view"
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
    <div className="py-10 sm:py-14">
      <header className="mb-8 sm:mb-10">
        <p className="text-xs uppercase tracking-widest text-brand-300 sm:text-sm">
          Directory
        </p>
        <h1 className="mt-2 font-display text-4xl font-bold text-ink-50 sm:text-5xl md:text-6xl">
          Coaches
        </h1>
        <p className="mt-3 max-w-xl text-sm text-ink-300 sm:text-base">
          <span className="font-mono font-semibold text-ink-100">
            {result.total.toLocaleString("en-US")}
          </span>{" "}
          staff member{result.total === 1 ? "" : "s"} across the NBA, EuroLeague
          and Liga ACB.
        </p>
      </header>

      <div className="mb-8">
        <DirectoryControls
          basePath="/coaches"
          kind="coaches"
          total={result.total}
          showing={result.items.length}
        />
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
