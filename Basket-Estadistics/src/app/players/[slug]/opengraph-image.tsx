import { ogCard } from "@/lib/og"

export const alt = "Player profile — globalhoopstats"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"
export const runtime = "nodejs"

type Props = { params: Promise<{ slug: string }> }

export default async function PlayerOgImage({ params }: Props) {
  const { slug } = await params
  const { getPlayerBySlug } = await import("@/lib/data/players")
  const profile = await getPlayerBySlug(slug).catch(() => null)

  const title = profile?.fullName ?? "Player"
  const team = profile?.team?.name ?? "Free agent"
  const league = profile?.league.name ?? ""
  const ppg = profile?.seasons[0]?.points
  const ppgStr = ppg != null ? `${ppg.toFixed(1)} PPG` : null
  const chips = [team, league, ppgStr].filter(Boolean) as string[]

  return ogCard({
    title,
    subtitle: profile
      ? `${profile.position ?? "Player"} · ${league}`
      : "globalhoopstats player profile",
    chips,
    pill: "Player profile",
  })
}
