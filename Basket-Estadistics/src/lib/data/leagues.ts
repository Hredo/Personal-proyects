import { and, desc, eq, isNotNull, sql } from "drizzle-orm"
import { getDb } from "@/lib/db/client"
import {
  coaches,
  leagues,
  playerSeasonStats,
  players,
  seasons,
  teams,
} from "@/lib/db/schema"
import { cached } from "@/lib/data/cache"

export type LeagueScorer = {
  playerId: string
  fullName: string
  slug: string
  imageUrl: string | null
  team: { id: string; name: string; slug: string; logoUrl: string | null } | null
  ppg: number
}

export type LeagueOverview = {
  id: string
  slug: string
  name: string
  region: string
  logoUrl: string | null
  seasonLabel: string | null
  teamCount: number
  playerCount: number
  coachCount: number
  topScorers: LeagueScorer[]
}

export type GlobalLeagueCounts = {
  leagues: number
  players: number
  teams: number
  coaches: number
}

type LeagueRow = {
  id: string
  slug: string
  name: string
  region: string
  logoUrl: string | null
}

function formatSeasonLabel(name: string | null): string | null {
  if (!name) return null
  return name
}

async function fetchLatestSeason(
  db: ReturnType<typeof getDb>,
  leagueId: string,
): Promise<{ id: string; name: string } | null> {
  const rows = await db
    .select({ id: seasons.id, name: seasons.name })
    .from(seasons)
    .innerJoin(
      playerSeasonStats,
      and(
        eq(playerSeasonStats.seasonId, seasons.id),
        eq(playerSeasonStats.leagueId, leagueId),
      ),
    )
    .orderBy(desc(seasons.name))
    .limit(1)
  return rows[0] ?? null
}

async function fetchCounts(
  db: ReturnType<typeof getDb>,
  leagueId: string,
): Promise<{ teamCount: number; playerCount: number; coachCount: number }> {
  const [t] = await db
    .select({ c: sql<number>`count(distinct team_id)` })
    .from(playerSeasonStats)
    .where(eq(playerSeasonStats.leagueId, leagueId))
  const [p] = await db
    .select({ c: sql<number>`count(distinct player_id)` })
    .from(playerSeasonStats)
    .where(eq(playerSeasonStats.leagueId, leagueId))
  const [c] = await db
    .select({ c: sql<number>`count(*)` })
    .from(coaches)
    .where(eq(coaches.leagueId, leagueId))
  return {
    teamCount: Number(t?.c ?? 0),
    playerCount: Number(p?.c ?? 0),
    coachCount: Number(c?.c ?? 0),
  }
}

async function fetchTopScorers(
  db: ReturnType<typeof getDb>,
  seasonId: string,
  limit = 3,
): Promise<LeagueScorer[]> {
  const rows = await db
    .select({
      playerId: players.id,
      fullName: sql<string>`${players.firstName} || ' ' || ${players.lastName}`,
      slug: players.slug,
      imageUrl: players.imageUrl,
      ppg: playerSeasonStats.pointsTotal,
      teamId: teams.id,
      teamName: teams.name,
      teamSlug: teams.slug,
      teamLogo: teams.logoUrl,
    })
    .from(playerSeasonStats)
    .innerJoin(players, eq(playerSeasonStats.playerId, players.id))
    .leftJoin(teams, eq(playerSeasonStats.teamId, teams.id))
    .where(
      and(
        eq(playerSeasonStats.seasonId, seasonId),
        isNotNull(playerSeasonStats.pointsTotal),
        sql`${playerSeasonStats.gamesPlayed} >= 5`,
      ),
    )
    .orderBy(sql`${playerSeasonStats.pointsTotal} desc`)
    .limit(limit)
  return rows.map((r) => ({
    playerId: r.playerId,
    fullName: r.fullName,
    slug: r.slug,
    imageUrl: r.imageUrl,
    ppg: Number(r.ppg ?? 0),
    team: r.teamId
      ? { id: r.teamId, name: r.teamName ?? "", slug: r.teamSlug ?? "", logoUrl: r.teamLogo }
      : null,
  }))
}

export const listLeagueOverviews = cached(
  async (): Promise<LeagueOverview[]> => {
  const db = getDb()
  const baseRows = await db
    .select({
      id: leagues.id,
      slug: leagues.slug,
      name: leagues.name,
      region: leagues.region,
      logoUrl: leagues.logoUrl,
    })
    .from(leagues)
    .orderBy(ascLabel(leagues.name))

  const overviews = await Promise.all(
    baseRows.map(async (row): Promise<LeagueOverview> => {
      const [counts, season] = await Promise.all([
        fetchCounts(db, row.id),
        fetchLatestSeason(db, row.id),
      ])
      const topScorers = season
        ? await fetchTopScorers(db, season.id, 3)
        : ([] as LeagueScorer[])
      return {
        id: row.id,
        slug: row.slug,
        name: row.name,
        region: row.region,
        logoUrl: row.logoUrl,
        seasonLabel: formatSeasonLabel(season?.name ?? null),
        teamCount: counts.teamCount,
        playerCount: counts.playerCount,
        coachCount: counts.coachCount,
        topScorers,
      }
    }),
  )
  return overviews
  },
  "listLeagueOverviews",
  ["leagues", "seasons", "player-season-stats"],
  600,
)

function ascLabel(column: typeof leagues.name) {
  return sql`lower(${column}) asc`
}

export const getGlobalLeagueCounts = cached(
  async (): Promise<GlobalLeagueCounts> => {
    const db = getDb()
    const [l] = await db.select({ c: sql<number>`count(*)` }).from(leagues)
    const [p] = await db.select({ c: sql<number>`count(*)` }).from(players)
    const [t] = await db.select({ c: sql<number>`count(*)` }).from(teams)
    const [c] = await db.select({ c: sql<number>`count(*)` }).from(coaches)
    return {
      leagues: Number(l?.c ?? 0),
      players: Number(p?.c ?? 0),
      teams: Number(t?.c ?? 0),
      coaches: Number(c?.c ?? 0),
    }
  },
  "getGlobalLeagueCounts",
  ["players", "teams", "coaches"],
  600,
)
