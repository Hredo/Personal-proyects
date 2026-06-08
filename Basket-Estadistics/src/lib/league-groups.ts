/**
 * League filter grouping shared by the navbar dropdowns and the in-page
 * directory filters. The three Spanish FEB competitions are grouped under a
 * single "FEB" parent: selecting `feb` matches all three, while each child
 * (leb-oro / leb-plata / eba) matches only itself.
 */

export const FEB_GROUP_SLUG = "feb"
export const FEB_LEAGUE_SLUGS = ["leb-oro", "leb-plata", "eba"] as const

export type LeagueFilterChild = { slug: string; label: string }
export type LeagueFilterNode = LeagueFilterChild & {
  children?: LeagueFilterChild[]
}

export const LEAGUE_FILTER_TREE: LeagueFilterNode[] = [
  { slug: "nba", label: "NBA" },
  { slug: "euroleague", label: "EuroLeague" },
  { slug: "acb", label: "ACB" },
  {
    slug: FEB_GROUP_SLUG,
    label: "FEB",
    children: [
      { slug: "leb-oro", label: "LEB Oro" },
      { slug: "leb-plata", label: "LEB Plata" },
      { slug: "eba", label: "EBA" },
    ],
  },
]

const FEB_CHILD_SET: ReadonlySet<string> = new Set(FEB_LEAGUE_SLUGS)

/** True when a selected filter slug belongs to the FEB group (parent or child). */
export function isFebFilter(slug: string | null | undefined): boolean {
  return slug === FEB_GROUP_SLUG || (!!slug && FEB_CHILD_SET.has(slug))
}

/**
 * Expand a filter slug to the concrete league slugs it matches. Returns null
 * when there is no filter (i.e. "all leagues").
 */
export function leagueSlugsFor(slug: string | null | undefined): string[] | null {
  if (!slug) return null
  if (slug === FEB_GROUP_SLUG) return [...FEB_LEAGUE_SLUGS]
  return [slug]
}
