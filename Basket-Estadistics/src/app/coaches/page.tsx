import type { Metadata } from "next"
import { CoachCard } from "@/components/staff/coach-card"
import { CoachFilters } from "@/components/staff/coach-filters"
import { Pagination } from "@/components/ui/pagination"
import { listCoaches, type ListCoachesInput } from "@/lib/data/staff"

type SearchParams = Partial<
  Record<keyof ListCoachesInput | "q" | "page", string>
>

export const metadata: Metadata = {
  title: "Coaches & Staff",
  description:
    "Browse every head coach, assistant and staff member across the NBA, EuroLeague and Liga ACB.",
}

const LEAGUE_VALUES = new Set(["nba", "euroleague", "acb"])
const ROLE_VALUES = new Set(["head_coach", "assistant_coach", "staff"])
const PAGE_SIZE = 24

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
  const { items, total, page, totalPages, pageSize } = result

  const filterSearchParams: Record<string, string | undefined> = {
    league: sp.league,
    team: sp.team,
    role: sp.role,
    q: sp.q,
  }

  return (
    <div className="py-8 sm:py-12">
      <header className="mb-6 sm:mb-8">
        <p className="text-xs uppercase tracking-widest text-brand-300 sm:text-sm">
          Directory
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold text-ink-50 sm:text-4xl md:text-5xl">
          Coaches &amp; <span className="text-gradient-brand">staff</span>
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-ink-300 sm:text-base">
          <span className="font-mono font-semibold text-ink-100">
            {total.toLocaleString("en-US")}
          </span>{" "}
          staff member{total === 1 ? "" : "s"} across the NBA, EuroLeague and
          Liga ACB. Filter by league, team or role.
        </p>
      </header>

      <div className="mb-6">
        <CoachFilters />
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center sm:p-12">
          <p className="text-sm text-ink-200 sm:text-base">
            No staff match your filters.
          </p>
          <p className="mt-1 text-xs text-ink-400 sm:text-sm">
            Try a different league, role or partial name.
          </p>
        </div>
      ) : (
        <>
          <ul className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
            {items.map((c, idx) => (
              <li key={c.id}>
                <CoachCard coach={c} index={idx} />
              </li>
            ))}
          </ul>

          <div className="mt-6 sm:mt-8">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              total={total}
              pageSize={pageSize}
              basePath="/coaches"
              searchParams={filterSearchParams}
            />
          </div>
        </>
      )}
    </div>
  )
}
