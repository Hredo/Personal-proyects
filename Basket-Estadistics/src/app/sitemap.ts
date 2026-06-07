import type { MetadataRoute } from "next"
import { listAllPlayerSlugs } from "@/lib/data/players"
import { listAllCoachSlugs } from "@/lib/data/staff"
import { listTeamOptions } from "@/lib/data/teams"
import { SITE } from "@/lib/site"

const STATIC_ROUTES: Array<{
  path: string
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]
  priority: number
}> = [
  { path: "/", changeFrequency: "daily", priority: 1 },
  { path: "/leagues", changeFrequency: "daily", priority: 0.9 },
  { path: "/compare", changeFrequency: "monthly", priority: 0.6 },
  { path: "/ai-advisor", changeFrequency: "monthly", priority: 0.6 },
  { path: "/terms", changeFrequency: "monthly", priority: 0.3 },
  { path: "/privacy", changeFrequency: "monthly", priority: 0.3 },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((r) => ({
    url: `${SITE.url}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }))

  const [playerSlugs, teamOptions, coachSlugs] = await Promise.all([
    listAllPlayerSlugs(3000).catch(() => [] as Array<{ slug: string }>),
    listTeamOptions(1000).catch(
      () =>
        [] as Array<{
          id: string
          name: string
          slug: string
          leagueSlug: string
        }>,
    ),
    listAllCoachSlugs(3000).catch(() => [] as Array<{ slug: string }>),
  ])

  const playerEntries: MetadataRoute.Sitemap = playerSlugs.map((p) => ({
    url: `${SITE.url}/players/${p.slug}`,
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.8,
  }))

  const teamEntries: MetadataRoute.Sitemap = teamOptions.map((t) => ({
    url: `${SITE.url}/teams/${t.leagueSlug}/${t.slug}`,
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.8,
  }))

  const coachEntries: MetadataRoute.Sitemap = coachSlugs.map((c) => ({
    url: `${SITE.url}/coaches/${c.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }))

  return [...staticEntries, ...playerEntries, ...teamEntries, ...coachEntries]
}
