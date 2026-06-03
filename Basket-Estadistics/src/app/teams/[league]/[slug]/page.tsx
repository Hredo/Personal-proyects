import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { FadeIn } from "@/components/animations/fade-in"
import { TeamDetailView } from "@/components/teams/team-detail-view"
import { getTeamBySlug, listTeamOptions } from "@/lib/data/teams"

const LEAGUE_VALUES = new Set(["nba", "euroleague", "acb"])

type Params = { league: string; slug: string }

export const dynamicParams = true

export async function generateStaticParams(): Promise<Array<{ league: string; slug: string }>> {
  const options = await listTeamOptions(500)
  return options
    .filter((t) => LEAGUE_VALUES.has(t.leagueSlug))
    .map((t) => ({ league: t.leagueSlug, slug: t.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  const { league, slug } = await params
  if (!LEAGUE_VALUES.has(league)) return { title: "Team not found" }
  const team = await getTeamBySlug(league, slug)
  if (!team) return { title: "Team not found" }
  const record = team.seasonStats
    ? ` ${team.seasonStats.wins}-${team.seasonStats.losses} this season.`
    : ""
  const description = `${team.name} — ${team.league.name} roster with ${team.roster.length} players and ${team.staff.length} staff members.${record}`
  return {
    title: team.name,
    description,
  }
}

export default async function TeamDetailPage({
  params,
}: {
  params: Promise<Params>
}) {
  const { league, slug } = await params
  if (!LEAGUE_VALUES.has(league)) notFound()
  const team = await getTeamBySlug(league, slug)
  if (!team) notFound()

  return (
    <div className="py-8">
      <FadeIn>
        <Link
          href="/teams"
          className="mb-6 inline-flex items-center gap-2 text-sm text-ink-300 transition hover:text-[var(--brand-300,#f8c98a)]"
        >
          ← Back to teams
        </Link>
      </FadeIn>
      <TeamDetailView team={team} />
    </div>
  )
}
