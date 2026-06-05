import type { Metadata } from "next"
import { FadeIn } from "@/components/animations/fade-in"
import { getGlobalLeagueCounts, listLeagueOverviews } from "@/lib/data/leagues"
import { GlobalStatsBand } from "@/components/leagues/global-stats-band"
import { LeagueOverview } from "@/components/leagues/league-overview"

export const metadata: Metadata = {
  title: "Leagues",
  description:
    "NBA, EuroLeague and Liga ACB — coverage, season leaders and top scorers for every league in our database.",
}

export const revalidate = 600

export default async function LeaguesPage() {
  const [leagues, counts] = await Promise.all([
    listLeagueOverviews(),
    getGlobalLeagueCounts(),
  ])

  return (
    <div className="relative py-8 sm:py-12">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 -z-10 h-[420px] bg-grid-fade opacity-60"
      />
      <div
        aria-hidden
        className="absolute left-1/2 top-0 -z-10 h-72 w-[640px] -translate-x-1/2 rounded-full bg-brand-500/15 blur-3xl sm:h-96 sm:w-[900px]"
      />

      <FadeIn>
        <header className="mb-8 sm:mb-10">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-300 sm:text-xs">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand-400" />
            </span>
            Coverage
          </div>
          <h1 className="mt-3 font-display text-4xl font-bold leading-[0.95] tracking-[-0.02em] text-ink-50 sm:text-5xl md:text-6xl">
            League <span className="text-gradient-shimmer">hubs.</span>
          </h1>
          <p className="mt-4 max-w-2xl text-sm text-ink-200 sm:text-base">
            Three professional leagues, one scouting engine. Each hub shows the
            current season, the top three scorers, the team on top of the
            standings and direct jumps to the player and team directories.
          </p>
        </header>
      </FadeIn>

      <FadeIn delay={0.1}>
        <GlobalStatsBand counts={counts} />
      </FadeIn>

      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5 xl:grid-cols-3">
        {leagues.map((lg, i) => (
          <FadeIn key={lg.id} delay={0.05 * (i + 1)} y={20}>
            <LeagueOverview data={lg} index={i} />
          </FadeIn>
        ))}
      </div>
    </div>
  )
}
