import { and, asc, desc, eq, like, sql } from "drizzle-orm"
import { getDb } from "@/lib/db/client"
import { leagues, players, seasons, teamSeasonStats, teams } from "@/lib/db/schema"
import type { PlayerListItem } from "@/lib/data/players"
import type { CoachListItem } from "@/lib/data/staff"
import { cached } from "@/lib/data/cache"

export type TeamListItem = {
  id: string
  name: string
  slug: string
  logoUrl: string | null
  country: string | null
  city: string | null
  shortName: string | null
  foundedYear: number | null
  arena: string | null
  primaryColor: string | null
  league: { id: string; name: string; slug: string; country: string }
  playerCount: number
  seasonStats: {
    seasonId: string
    year: number
    gamesPlayed: number
    wins: number | null
    losses: number | null
    winPct: number | null
    pointsFor: number | null
    pointsAgainst: number | null
    position: number | null
    pace: number | null
    offRtg: number | null
    defRtg: number | null
    netRtg: number | null
  } | null
}

export type ListTeamsInput = {
  query?: string
  league?: string
  sort?: "name" | "players" | "wins" | "netRtg"
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

  const conditions = []
  if (input.league) conditions.push(eq(leagues.slug, input.league))
  if (input.query) {
    const q = `%${input.query.toLowerCase()}%`
    conditions.push(like(sql`lower(${teams.name})`, q))
  }
  const where = conditions.length ? and(...conditions) : undefined

  const playerCountExpr = sql<number>`(
    select count(*) from ${players} where ${players.currentTeamId} = ${teams.id}
  )`

  const totalRow = await db
    .select({ c: sql<number>`count(*)` })
    .from(teams)
    .innerJoin(leagues, eq(teams.leagueId, leagues.id))
    .where(where)
  const total = Number(totalRow[0]?.c ?? 0)

  const dir = order === "asc" ? "asc" : "desc"
  const orderByExpr = (() => {
    switch (sort) {
      case "players":
        return sql`coalesce(${playerCountExpr}, 0) ${sql.raw(dir)}, ${teams.name} ${sql.raw(dir)}`
      case "wins":
        return sql`coalesce(${teamSeasonStats.wins}, 0) ${sql.raw(dir)}, ${teams.name} ${sql.raw(dir)}`
      case "netRtg":
        return sql`coalesce(${teamSeasonStats.netRtg}, 0) ${sql.raw(dir)}, ${teams.name} ${sql.raw(dir)}`
      default:
        return sql`${teams.name} ${sql.raw(dir)}`
    }
  })()

  const rows = await db
    .select({
      id: teams.id,
      name: teams.name,
      slug: teams.slug,
      logoUrl: teams.logoUrl,
      country: teams.country,
      city: teams.city,
      shortName: teams.shortName,
      foundedYear: teams.foundedYear,
      arena: teams.arena,
      primaryColor: teams.primaryColor,
      leagueId: leagues.id,
      leagueName: leagues.name,
      leagueSlug: leagues.slug,
      leagueCountry: leagues.country,
      playerCount: playerCountExpr,
      seasonId: teamSeasonStats.seasonId,
      seasonYear: seasons.year,
      gamesPlayed: teamSeasonStats.gamesPlayed,
      wins: teamSeasonStats.wins,
      losses: teamSeasonStats.losses,
      winPct: teamSeasonStats.winPct,
      pointsFor: teamSeasonStats.pointsFor,
      pointsAgainst: teamSeasonStats.pointsAgainst,
      position: teamSeasonStats.position,
      pace: teamSeasonStats.pace,
      offRtg: teamSeasonStats.offRtg,
      defRtg: teamSeasonStats.defRtg,
      netRtg: teamSeasonStats.netRtg,
    })
    .from(teams)
    .innerJoin(leagues, eq(teams.leagueId, leagues.id))
    .leftJoin(
      teamSeasonStats,
      and(
        eq(teamSeasonStats.teamId, teams.id),
        eq(
          teamSeasonStats.seasonId,
          sql`(select s.id from seasons s where s.league_id = ${leagues.id} order by s.year desc limit 1)`,
        ),
      ),
    )
    .leftJoin(seasons, eq(teamSeasonStats.seasonId, seasons.id))
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
      country: r.country,
      city: r.city,
      shortName: r.shortName,
      foundedYear: r.foundedYear,
      arena: r.arena,
      primaryColor: r.primaryColor,
      league: {
        id: r.leagueId,
        name: r.leagueName,
        slug: r.leagueSlug,
        country: r.leagueCountry,
      },
      playerCount: Number(r.playerCount ?? 0),
      seasonStats:
        r.gamesPlayed == null
          ? null
          : {
              seasonId: r.seasonId!,
              year: r.seasonYear ?? 0,
              gamesPlayed: r.gamesPlayed,
              wins: r.wins,
              losses: r.losses,
              winPct: r.winPct,
              pointsFor: r.pointsFor,
              pointsAgainst: r.pointsAgainst,
              position: r.position,
              pace: r.pace,
              offRtg: r.offRtg,
              defRtg: r.defRtg,
              netRtg: r.netRtg,
            },
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
  const rows = await db
    .select({
      id: teams.id,
      name: teams.name,
      slug: teams.slug,
      leagueSlug: leagues.slug,
    })
    .from(teams)
    .innerJoin(leagues, eq(teams.leagueId, leagues.id))
    .orderBy(asc(teams.name))
    .limit(limit)
  return rows
}

export type TeamProfile = {
  id: string
  name: string
  slug: string
  logoUrl: string | null
  country: string | null
  city: string | null
  shortName: string | null
  foundedYear: number | null
  arena: string | null
  arenaCapacity: number | null
  websiteUrl: string | null
  primaryColor: string | null
  sourceId: string
  league: {
    id: string
    name: string
    slug: string
    country: string
    source: string
  }
  roster: PlayerListItem[]
  staff: CoachListItem[]
  seasonStats: {
    seasonId: string
    year: number
    gamesPlayed: number
    wins: number | null
    losses: number | null
    winPct: number | null
    pointsFor: number | null
    pointsAgainst: number | null
    position: number | null
    pace: number | null
    offRtg: number | null
    defRtg: number | null
    netRtg: number | null
  } | null
}

export const getTeamBySlug = cached(
  async (
  leagueSlug: string,
  slug: string,
): Promise<TeamProfile | null> => {
  const db = getDb()
  const rows = await db
    .select({
      id: teams.id,
      name: teams.name,
      slug: teams.slug,
      logoUrl: teams.logoUrl,
      country: teams.country,
      city: teams.city,
      shortName: teams.shortName,
      foundedYear: teams.foundedYear,
      arena: teams.arena,
      arenaCapacity: teams.arenaCapacity,
      websiteUrl: teams.websiteUrl,
      primaryColor: teams.primaryColor,
      sourceId: teams.sourceId,
      leagueId: leagues.id,
      leagueName: leagues.name,
      leagueSlug: leagues.slug,
      leagueCountry: leagues.country,
      leagueSource: leagues.source,
    })
    .from(teams)
    .innerJoin(leagues, eq(teams.leagueId, leagues.id))
    .where(and(eq(leagues.slug, leagueSlug), eq(teams.slug, slug)))
    .limit(1)

  const r = rows[0]
  if (!r) return null

  const { listPlayers } = await import("@/lib/data/players")
  const { listCoachesByTeam } = await import("@/lib/data/staff")

  const [roster, staff, statRows] = await Promise.all([
    listPlayers({
      league: leagueSlug,
      team: r.name,
      sort: "name",
      order: "asc",
      pageSize: 200,
    }),
    listCoachesByTeam(r.id),
    db
      .select({
        seasonId: teamSeasonStats.seasonId,
        year: seasons.year,
        gamesPlayed: teamSeasonStats.gamesPlayed,
        wins: teamSeasonStats.wins,
        losses: teamSeasonStats.losses,
        winPct: teamSeasonStats.winPct,
        pointsFor: teamSeasonStats.pointsFor,
        pointsAgainst: teamSeasonStats.pointsAgainst,
        position: teamSeasonStats.position,
        pace: teamSeasonStats.pace,
        offRtg: teamSeasonStats.offRtg,
        defRtg: teamSeasonStats.defRtg,
        netRtg: teamSeasonStats.netRtg,
      })
      .from(teamSeasonStats)
      .innerJoin(seasons, eq(teamSeasonStats.seasonId, seasons.id))
      .where(
        and(
          eq(teamSeasonStats.teamId, r.id),
          eq(seasons.leagueId, r.leagueId),
        ),
      )
      .orderBy(desc(seasons.year))
      .limit(1),
  ])

  const seasonStats = statRows[0] ?? null

  return {
    id: r.id,
    name: r.name,
    slug: r.slug,
    logoUrl: r.logoUrl,
    country: r.country,
    city: r.city,
    shortName: r.shortName,
    foundedYear: r.foundedYear,
    arena: r.arena,
    arenaCapacity: r.arenaCapacity,
    websiteUrl: r.websiteUrl,
    primaryColor: r.primaryColor,
    sourceId: r.sourceId,
    league: {
      id: r.leagueId,
      name: r.leagueName,
      slug: r.leagueSlug,
      country: r.leagueCountry,
      source: r.leagueSource,
    },
    roster: roster.items,
    staff,
    seasonStats: seasonStats
      ? {
          seasonId: seasonStats.seasonId,
          year: seasonStats.year,
          gamesPlayed: seasonStats.gamesPlayed,
          wins: seasonStats.wins,
          losses: seasonStats.losses,
          winPct: seasonStats.winPct,
          pointsFor: seasonStats.pointsFor,
          pointsAgainst: seasonStats.pointsAgainst,
          position: seasonStats.position,
          pace: seasonStats.pace,
          offRtg: seasonStats.offRtg,
          defRtg: seasonStats.defRtg,
          netRtg: seasonStats.netRtg,
        }
      : null,
  }
  },
  "getTeamBySlug",
  ["teams", "players", "team-stats"],
  3600,
)
