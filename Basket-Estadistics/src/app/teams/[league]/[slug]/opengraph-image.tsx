import { ogCard } from "@/lib/og"

export const alt = "Team profile — globalhoopstats"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"
export const runtime = "nodejs"

type Props = { params: Promise<{ league: string; slug: string }> }

export default async function TeamOgImage({ params }: Props) {
  const { league, slug } = await params
  const { getTeamBySlug } = await import("@/lib/data/teams")
  const team = await getTeamBySlug(league, slug).catch(() => null)

  const title = team?.name ?? "Team"
  const record = team?.seasonStats
    ? `${team.seasonStats.wins ?? 0}-${team.seasonStats.losses ?? 0}`
    : null
  const chips = [
    team?.league.name,
    record ? `Record ${record}` : null,
    `${team?.roster.length ?? 0} players`,
  ].filter(Boolean) as string[]

  return ogCard({
    title,
    subtitle: team
      ? `${team.city ?? ""} ${team.league.name}`.trim()
      : "globalhoopstats team profile",
    chips,
    pill: "Team profile",
    accent: league === "nba" ? "brand" : league === "acb" ? "magenta" : "cyan",
  })
}
