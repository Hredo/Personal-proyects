import { and, asc, eq, inArray, like, sql } from "drizzle-orm"
import { getDb } from "@/lib/db/client"
import { leagues, playerSeasonStats, teams } from "@/lib/db/schema"
import type { PlayerListItem } from "@/lib/data/players"
import type { CoachListItem } from "@/lib/data/staff"
import { cached } from "@/lib/data/cache"
import { leagueSlugsFor } from "@/lib/league-groups"

export type TeamListItem = {
  id: string
  name: string
  slug: string
  logoUrl: string | null
  city: string | null
  league: { id: string; name: string; slug: string; region: string }
  playerCount: number
}

export type ListTeamsInput = {
  query?: string
  league?: string
  sort?: "name" | "players"
  order?: "asc" | "desc"
  page?: number
  pageSize?: number
}

export type ListTeamsResult = {
  items: TeamListItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export async function listTeams(
  input: ListTeamsInput = {},
): Promise<ListTeamsResult> {
  const db = getDb()
  const page = Math.max(1, input.page ?? 1)
  const pageSize = Math.max(1, Math.min(input.pageSize ?? 24, 200))
  const order = input.order ?? "asc"
  const sort = input.sort ?? "name"
  const offset = (page - 1) * pageSize

  const leagueSlugs = leagueSlugsFor(input.league)
  const conditions = []
  if (leagueSlugs) conditions.push(inArray(leagues.slug, leagueSlugs))
  if (input.query) {
    const q = `%${input.query.toLowerCase()}%`
    conditions.push(like(sql`lower(${teams.name})`, q))
  }

  const playerCountExpr = sql<number>`(
    select count(*) from ${playerSeasonStats} pss
    where pss.team_id = ${teams.id}
  )`

  const tl = db.$with("tl").as(
    db
      .selectDistinct({
        teamId: playerSeasonStats.teamId,
        leagueId: playerSeasonStats.leagueId,
      })
      .from(playerSeasonStats),
  )

  const where = conditions.length ? and(...conditions) : undefined

  const totalRow = await db
    .with(tl)
    .select({ c: sql<number>`count(*)` })
    .from(teams)
    .innerJoin(tl, eq(teams.id, tl.teamId))
    .innerJoin(leagues, eq(tl.leagueId, leagues.id))
    .where(where)
  const total = Number(totalRow[0]?.c ?? 0)

  const dir = order === "asc" ? "asc" : "desc"
  const orderByExpr = (() => {
    switch (sort) {
      case "players":
        return sql`coalesce(${playerCountExpr}, 0) ${sql.raw(dir)}, ${teams.name} ${sql.raw(dir)}`
      default:
        return sql`${teams.name} ${sql.raw(dir)}`
    }
  })()

  const rows = await db
    .with(tl)
    .select({
      id: teams.id,
      name: teams.name,
      slug: teams.slug,
      logoUrl: teams.logoUrl,
      city: teams.city,
      leagueId: leagues.id,
      leagueName: leagues.name,
      leagueSlug: leagues.slug,
      leagueRegion: leagues.region,
      playerCount: playerCountExpr,
    })
    .from(teams)
    .innerJoin(tl, eq(teams.id, tl.teamId))
    .innerJoin(leagues, eq(tl.leagueId, leagues.id))
    .where(where)
    .orderBy(orderByExpr)
    .limit(pageSize)
    .offset(offset)

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return {
    items: rows.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      logoUrl: r.logoUrl,
      city: r.city,
      league: {
        id: r.leagueId,
        name: r.leagueName,
        slug: r.leagueSlug,
        region: r.leagueRegion,
      },
      playerCount: Number(r.playerCount ?? 0),
    })),
    total,
    page,
    pageSize,
    totalPages,
  }
}

export type TeamOption = { id: string; name: string; slug: string; leagueSlug: string }

export async function listTeamOptions(limit = 300): Promise<TeamOption[]> {
  const db = getDb()
  const tl = db.$with("tl").as(
    db
      .selectDistinct({
        teamId: playerSeasonStats.teamId,
        leagueId: playerSeasonStats.leagueId,
      })
      .from(playerSeasonStats),
  )
  const rows = await db
    .with(tl)
    .select({
      id: teams.id,
      name: teams.name,
      slug: teams.slug,
      leagueSlug: leagues.slug,
    })
    .from(teams)
    .innerJoin(tl, eq(teams.id, tl.teamId))
    .innerJoin(leagues, eq(tl.leagueId, leagues.id))
    .orderBy(asc(teams.name))
    .limit(limit)
  return rows
}

export type TeamProfile = {
  id: string
  name: string
  slug: string
  logoUrl: string | null
  city: string | null
  league: { id: string; name: string; slug: string; region: string }
  roster: PlayerListItem[]
  staff: CoachListItem[]
}

export const getTeamBySlug = cached(
  async (leagueSlug: string, slug: string): Promise<TeamProfile | null> => {
  const db = getDb()
  const tl = db.$with("tl").as(
    db
      .selectDistinct({
        teamId: playerSeasonStats.teamId,
        leagueId: playerSeasonStats.leagueId,
      })
      .from(playerSeasonStats),
  )
  const rows = await db
    .with(tl)
    .select({
      id: teams.id,
      name: teams.name,
      slug: teams.slug,
      logoUrl: teams.logoUrl,
      city: teams.city,
      leagueId: leagues.id,
      leagueName: leagues.name,
      leagueSlug: leagues.slug,
      leagueRegion: leagues.region,
    })
    .from(teams)
    .innerJoin(tl, eq(teams.id, tl.teamId))
    .innerJoin(leagues, eq(tl.leagueId, leagues.id))
    .where(and(eq(leagues.slug, leagueSlug), eq(teams.slug, slug)))
    .limit(1)

  const r = rows[0]
  if (!r) return null

  const { listPlayers } = await import("@/lib/data/players")
  const { listCoachesByTeam } = await import("@/lib/data/staff")

  const [roster, staff] = await Promise.all([
    listPlayers({
      league: leagueSlug,
      team: r.name,
      sort: "name",
      order: "asc",
      pageSize: 200,
    }),
    listCoachesByTeam(r.id),
  ])

  return {
    id: r.id,
    name: r.name,
    slug: r.slug,
    logoUrl: r.logoUrl,
    city: r.city,
    league: {
      id: r.leagueId,
      name: r.leagueName,
      slug: r.leagueSlug,
      region: r.leagueRegion,
    },
    roster: roster.items,
    staff,
  }
  },
  "getTeamBySlug",
  ["teams", "players"],
  3600,
)
