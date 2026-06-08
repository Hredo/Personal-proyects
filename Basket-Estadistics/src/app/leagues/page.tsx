import type { Metadata } from "next"
import { FadeIn } from "@/components/animations/fade-in"
import { getGlobalLeagueCounts, listLeagueOverviews } from "@/lib/data/leagues"
import { GlobalStatsBand } from "@/components/leagues/global-stats-band"
import { LeagueOverview } from "@/components/leagues/league-overview"
import { DirectoryHero } from "@/components/ui/directory-hero"

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
    <div className="relative pb-8 sm:pb-12">
      <DirectoryHero
        eyebrow="Coverage"
        title={
          <>
            League <span className="text-gradient-brand">hubs.</span>
          </>
        }
        description="Six professional leagues, one scouting engine. Each hub shows the current season, the top three scorers and direct jumps into the player and team directories."
      />

      <FadeIn delay={0.1} className="mt-8">
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
