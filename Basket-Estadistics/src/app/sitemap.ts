import type { MetadataRoute } from "next"

const SITE = "https://basketestadistics.com"

const STATIC_ROUTES: { path: string; changeFrequency?: MetadataRoute.Sitemap[number]["changeFrequency"]; priority?: number }[] = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/players", changeFrequency: "daily", priority: 0.9 },
  { path: "/teams", changeFrequency: "daily", priority: 0.9 },
  { path: "/coaches", changeFrequency: "weekly", priority: 0.7 },
  { path: "/leagues", changeFrequency: "weekly", priority: 0.8 },
  { path: "/compare", changeFrequency: "monthly", priority: 0.8 },
  { path: "/ai-advisor", changeFrequency: "monthly", priority: 0.6 },
]

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  return STATIC_ROUTES.map((r) => ({
    url: `${SITE}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }))
}
