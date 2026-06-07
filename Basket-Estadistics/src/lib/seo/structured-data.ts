import { SITE } from "@/lib/site"

type JsonLdObject = Record<string, unknown>

/**
 * schema.org BreadcrumbList for a page's location in the site hierarchy.
 * `path` is the absolute path (e.g. "/players/luka-doncic").
 */
export function breadcrumbJsonLd(
  items: Array<{ name: string; path: string }>,
): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${SITE.url}${item.path}`,
    })),
  }
}

/** schema.org Person for a player profile (rich results for athletes). */
export function playerJsonLd(p: {
  fullName: string
  slug: string
  position?: string | null
  nationality?: string | null
  birthdate?: string | null
  heightCm?: number | null
  weightKg?: number | null
  photoUrl?: string | null
  teamName?: string | null
  leagueName: string
}): JsonLdObject {
  const data: JsonLdObject = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: p.fullName,
    url: `${SITE.url}/players/${p.slug}`,
    jobTitle: p.position
      ? `Basketball Player (${p.position})`
      : "Basketball Player",
  }
  if (p.nationality) data.nationality = p.nationality
  if (p.birthdate) data.birthDate = p.birthdate
  if (p.photoUrl) data.image = p.photoUrl
  if (p.heightCm) {
    data.height = {
      "@type": "QuantitativeValue",
      value: p.heightCm,
      unitCode: "CMT",
    }
  }
  if (p.weightKg) {
    data.weight = {
      "@type": "QuantitativeValue",
      value: p.weightKg,
      unitCode: "KGM",
    }
  }
  if (p.teamName) {
    data.memberOf = {
      "@type": "SportsTeam",
      name: p.teamName,
      sport: "Basketball",
    }
  }
  return data
}

/** schema.org SportsTeam for a team page. */
export function teamJsonLd(t: {
  name: string
  slug: string
  leagueSlug: string
  leagueName: string
  logoUrl?: string | null
  city?: string | null
}): JsonLdObject {
  const data: JsonLdObject = {
    "@context": "https://schema.org",
    "@type": "SportsTeam",
    name: t.name,
    sport: "Basketball",
    url: `${SITE.url}/teams/${t.leagueSlug}/${t.slug}`,
    memberOf: {
      "@type": "SportsOrganization",
      name: t.leagueName,
      sport: "Basketball",
    },
  }
  if (t.logoUrl) data.logo = t.logoUrl
  if (t.city) data.location = { "@type": "Place", name: t.city }
  return data
}
