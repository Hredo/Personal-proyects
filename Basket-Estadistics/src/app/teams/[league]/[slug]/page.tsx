import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { FadeIn } from "@/components/animations/fade-in"
import { TeamDetailView } from "@/components/teams/team-detail-view"
import { getTeamBySlug, listTeamOptions } from "@/lib/data/teams"
import { JsonLd } from "@/components/marketing/json-ld"
import { breadcrumbJsonLd, teamJsonLd } from "@/lib/seo/structured-data"
import { SITE } from "@/lib/site"

type Params = { league: string; slug: string }

export const dynamicParams = true

export async function generateStaticParams(): Promise<
  Array<{ league: string; slug: string }>
> {
  const options = await listTeamOptions(2000)
  return options.map((t) => ({ league: t.leagueSlug, slug: t.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  const { league, slug } = await params
  const team = await getTeamBySlug(league, slug)
  if (!team) return { title: "Team not found" }
  const description = `${team.name} — ${team.league.name} roster with ${team.roster.length} players and ${team.staff.length} staff members.`
  return {
    title: team.name,
    description,
    alternates: { canonical: `${SITE.url}/teams/${league}/${slug}` },
  }
}

export default async function TeamDetailPage({
  params,
}: {
  params: Promise<Params>
}) {
  const { league, slug } = await params
  const team = await getTeamBySlug(league, slug)
  if (!team) notFound()

  const structuredData = [
    teamJsonLd({
      name: team.name,
      slug: team.slug,
      leagueSlug: team.league.slug,
      leagueName: team.league.name,
      logoUrl: team.logoUrl,
      city: team.city,
    }),
    breadcrumbJsonLd([
      { name: "Teams", path: "/teams" },
      { name: team.name, path: `/teams/${team.league.slug}/${team.slug}` },
    ]),
  ]

  return (
    <div className="py-8">
      <JsonLd data={structuredData} />
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
