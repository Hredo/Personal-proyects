import { and, asc, eq, inArray, like, sql } from "drizzle-orm"
import { getDb } from "@/lib/db/client"
import { coaches, leagues, teams } from "@/lib/db/schema"
import { leagueSlugsFor } from "@/lib/league-groups"

export type CoachListItem = {
  id: string
  fullName: string
  slug: string
  role: "head_coach" | "assistant_coach" | "staff"
  nationality: string | null
  age: number | null
  photoUrl: string | null
  league: { id: string; name: string; slug: string; region: string }
  team: { id: string; name: string; slug: string; logoUrl: string | null }
}

export type ListCoachesInput = {
  query?: string
  league?: string
  team?: string
  role?: "head_coach" | "assistant_coach" | "staff"
  page?: number
  pageSize?: number
}

export type ListCoachesResult = {
  items: CoachListItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

const ROLE_PRIORITY: Record<CoachListItem["role"], number> = {
  head_coach: 0,
  assistant_coach: 1,
  staff: 2,
}

export async function listCoaches(
  input: ListCoachesInput = {},
): Promise<ListCoachesResult> {
  const db = getDb()
  const page = Math.max(1, input.page ?? 1)
  const pageSize = Math.max(1, Math.min(input.pageSize ?? 24, 200))
  const offset = (page - 1) * pageSize

  const conditions = []
  const leagueSlugs = leagueSlugsFor(input.league)
  if (leagueSlugs) conditions.push(inArray(leagues.slug, leagueSlugs))
  if (input.team) {
    const tq = `%${input.team.toLowerCase()}%`
    conditions.push(like(sql`lower(${teams.name})`, tq))
  }
  if (input.role) conditions.push(eq(coaches.role, input.role))
  if (input.query) {
    const q = `%${input.query.toLowerCase()}%`
    conditions.push(like(sql`lower(${coaches.fullName})`, q))
  }
  const where = conditions.length ? and(...conditions) : undefined

  const countRow = await db
    .select({ c: sql<number>`count(*)` })
    .from(coaches)
    .innerJoin(leagues, eq(coaches.leagueId, leagues.id))
    .innerJoin(teams, eq(coaches.teamId, teams.id))
    .where(where)
  const total = Number(countRow[0]?.c ?? 0)

  const rows = await db
    .select({
      id: coaches.id,
      fullName: coaches.fullName,
      slug: coaches.slug,
      role: coaches.role,
      nationality: coaches.nationality,
      age: coaches.age,
      photoUrl: coaches.photoUrl,
      leagueId: leagues.id,
      leagueName: leagues.name,
      leagueSlug: leagues.slug,
      leagueRegion: leagues.region,
      teamId: teams.id,
      teamName: teams.name,
      teamSlug: teams.slug,
      teamLogo: teams.logoUrl,
    })
    .from(coaches)
    .innerJoin(leagues, eq(coaches.leagueId, leagues.id))
    .innerJoin(teams, eq(coaches.teamId, teams.id))
    .where(where)
    .orderBy(asc(teams.name), asc(coaches.role), asc(coaches.fullName))
    .limit(pageSize)
    .offset(offset)

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return {
    items: rows.map((r) => ({
      id: r.id,
      fullName: r.fullName,
      slug: r.slug,
      role: r.role as CoachListItem["role"],
      nationality: r.nationality,
      age: r.age,
      photoUrl: r.photoUrl,
      league: {
        id: r.leagueId,
        name: r.leagueName,
        slug: r.leagueSlug,
        region: r.leagueRegion,
      },
      team: {
        id: r.teamId,
        name: r.teamName,
        slug: r.teamSlug,
        logoUrl: r.teamLogo,
      },
    })),
    total,
    page,
    pageSize,
    totalPages,
  }
}

export type CoachGroup = {
  team: CoachListItem["team"]
  league: CoachListItem["league"]
  coaches: CoachListItem[]
}

export function groupCoachesByTeam(items: CoachListItem[]): CoachGroup[] {
  const map = new Map<string, CoachGroup>()
  for (const c of items) {
    const key = c.team.id
    let group = map.get(key)
    if (!group) {
      group = { team: c.team, league: c.league, coaches: [] }
      map.set(key, group)
    }
    group.coaches.push(c)
  }
  for (const g of map.values()) {
    g.coaches.sort(
      (a, b) =>
        ROLE_PRIORITY[a.role] - ROLE_PRIORITY[b.role] ||
        a.fullName.localeCompare(b.fullName),
    )
  }
  return [...map.values()].sort((a, b) => a.team.name.localeCompare(b.team.name))
}

export async function listCoachesByTeam(
  teamId: string,
): Promise<CoachListItem[]> {
  const db = getDb()
  const rows = await db
    .select({
      id: coaches.id,
      fullName: coaches.fullName,
      slug: coaches.slug,
      role: coaches.role,
      nationality: coaches.nationality,
      age: coaches.age,
      photoUrl: coaches.photoUrl,
      leagueId: leagues.id,
      leagueName: leagues.name,
      leagueSlug: leagues.slug,
      leagueRegion: leagues.region,
      teamId: teams.id,
      teamName: teams.name,
      teamSlug: teams.slug,
      teamLogo: teams.logoUrl,
    })
    .from(coaches)
    .innerJoin(leagues, eq(coaches.leagueId, leagues.id))
    .innerJoin(teams, eq(coaches.teamId, teams.id))
    .where(eq(coaches.teamId, teamId))
    .orderBy(asc(coaches.role), asc(coaches.fullName))

  return rows.map((r) => ({
    id: r.id,
    fullName: r.fullName,
    slug: r.slug,
    role: r.role as CoachListItem["role"],
    nationality: r.nationality,
    age: r.age,
    photoUrl: r.photoUrl,
    league: {
      id: r.leagueId,
      name: r.leagueName,
      slug: r.leagueSlug,
      region: r.leagueRegion,
    },
    team: {
      id: r.teamId,
      name: r.teamName,
      slug: r.teamSlug,
      logoUrl: r.teamLogo,
    },
  }))
}

export async function listAllCoachSlugs(
  limit = 5000,
): Promise<Array<{ slug: string }>> {
  const db = getDb()
  return db
    .select({ slug: coaches.slug })
    .from(coaches)
    .orderBy(asc(coaches.slug))
    .limit(limit)
}
