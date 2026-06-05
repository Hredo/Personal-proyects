import { and, desc, eq, isNotNull, sql } from "drizzle-orm"
import { getDb } from "@/lib/db/client"
import {
  coaches,
  leagues,
  playerStats,
  players,
  seasons,
  teamSeasonStats,
  teams,
} from "@/lib/db/schema"
import { cached } from "@/lib/data/cache"

export type LeagueScorer = {
  playerId: string
  fullName: string
  slug: string
  photoUrl: string | null
  team: { id: string; name: string; slug: string; logoUrl: string | null } | null
  ppg: number
}

export type LeagueLeader = {
  teamId: string
  name: string
  slug: string
  logoUrl: string | null
  primaryColor: string | null
  wins: number | null
  losses: number | null
  winPct: number | null
  netRtg: number | null
}

export type LeagueOverview = {
  id: string
  slug: string
  name: string
  country: string
  logoUrl: string | null
  source: string
  seasonLabel: string | null
  seasonYear: number | null
  teamCount: number
  playerCount: number
  coachCount: number
  topScorers: LeagueScorer[]
  leader: LeagueLeader | null
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
  country: string
  logoUrl: string | null
  source: string
}

function formatSeasonLabel(year: number | null): string | null {
  if (year == null) return null
  const next = year + 1
  const yy = String(next).slice(-2)
  return `${year}-${yy}`
}

async function fetchLatestSeason(
  db: ReturnType<typeof getDb>,
  leagueId: string,
): Promise<{ id: string; year: number } | null> {
  const rows = await db
    .select({ id: seasons.id, year: seasons.year })
    .from(seasons)
    .where(eq(seasons.leagueId, leagueId))
    .orderBy(desc(seasons.year))
    .limit(1)
  const r = rows[0]
  return r ? { id: r.id, year: r.year } : null
}

async function fetchCounts(
  db: ReturnType<typeof getDb>,
  league: LeagueRow,
): Promise<{ teamCount: number; playerCount: number; coachCount: number }> {
  const [t] = await db
    .select({ c: sql<number>`count(*)` })
    .from(teams)
    .where(eq(teams.leagueId, league.id))
  const [p] = await db
    .select({ c: sql<number>`count(*)` })
    .from(players)
    .where(eq(players.source, league.source))
  const [c] = await db
    .select({ c: sql<number>`count(*)` })
    .from(coaches)
    .where(eq(coaches.leagueId, league.id))
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
      fullName: players.fullName,
      slug: players.slug,
      photoUrl: players.photoUrl,
      ppg: playerStats.points,
      teamId: teams.id,
      teamName: teams.name,
      teamSlug: teams.slug,
      teamLogo: teams.logoUrl,
    })
    .from(playerStats)
    .innerJoin(players, eq(playerStats.playerId, players.id))
    .leftJoin(teams, eq(playerStats.teamId, teams.id))
    .where(
      and(
        eq(playerStats.seasonId, seasonId),
        isNotNull(playerStats.points),
        sql`${playerStats.gamesPlayed} >= 5`,
      ),
    )
    .orderBy(sql`${playerStats.points} desc`)
    .limit(limit)
  return rows.map((r) => ({
    playerId: r.playerId,
    fullName: r.fullName,
    slug: r.slug,
    photoUrl: r.photoUrl,
    ppg: Number(r.ppg ?? 0),
    team: r.teamId
      ? {
          id: r.teamId,
          name: r.teamName ?? "",
          slug: r.teamSlug ?? "",
          logoUrl: r.teamLogo,
        }
      : null,
  }))
}

async function fetchLeader(
  db: ReturnType<typeof getDb>,
  seasonId: string,
): Promise<LeagueLeader | null> {
  const rows = await db
    .select({
      teamId: teams.id,
      name: teams.name,
      slug: teams.slug,
      logoUrl: teams.logoUrl,
      primaryColor: teams.primaryColor,
      wins: teamSeasonStats.wins,
      losses: teamSeasonStats.losses,
      winPct: teamSeasonStats.winPct,
      netRtg: teamSeasonStats.netRtg,
    })
    .from(teamSeasonStats)
    .innerJoin(teams, eq(teamSeasonStats.teamId, teams.id))
    .where(
      and(
        eq(teamSeasonStats.seasonId, seasonId),
        isNotNull(teamSeasonStats.winPct),
      ),
    )
    .orderBy(sql`${teamSeasonStats.winPct} desc`)
    .limit(1)
  const r = rows[0]
  if (!r) return null
  return {
    teamId: r.teamId,
    name: r.name,
    slug: r.slug,
    logoUrl: r.logoUrl,
    primaryColor: r.primaryColor,
    wins: r.wins,
    losses: r.losses,
    winPct: r.winPct,
    netRtg: r.netRtg,
  }
}

export const listLeagueOverviews = cached(
  async (): Promise<LeagueOverview[]> => {
  const db = getDb()
  const baseRows = await db
    .select({
      id: leagues.id,
      slug: leagues.slug,
      name: leagues.name,
      country: leagues.country,
      logoUrl: leagues.logoUrl,
      source: leagues.source,
    })
    .from(leagues)
    .orderBy(ascLabel(leagues.name))

  const overviews = await Promise.all(
    baseRows.map(async (row): Promise<LeagueOverview> => {
      const [counts, season] = await Promise.all([
        fetchCounts(db, row),
        fetchLatestSeason(db, row.id),
      ])
      const [topScorers, leader] = season
        ? await Promise.all([
            fetchTopScorers(db, season.id, 3),
            fetchLeader(db, season.id),
          ])
        : [[] as LeagueScorer[], null as LeagueLeader | null]
      return {
        id: row.id,
        slug: row.slug,
        name: row.name,
        country: row.country,
        logoUrl: row.logoUrl,
        source: row.source,
        seasonLabel: formatSeasonLabel(season?.year ?? null),
        seasonYear: season?.year ?? null,
        teamCount: counts.teamCount,
        playerCount: counts.playerCount,
        coachCount: counts.coachCount,
        topScorers,
        leader,
      }
    }),
  )
  return overviews
  },
  "listLeagueOverviews",
  ["leagues", "seasons", "team-stats"],
  600,
)

function ascLabel(column: typeof leagues.name) {
  return sql`lower(${column}) asc`
}

export const getGlobalLeagueCounts = cached(
  async (): Promise<GlobalLeagueCounts> => {
    const db = getDb()
    const [l] = await db
      .select({ c: sql<number>`count(*)` })
      .from(leagues)
    const [p] = await db
      .select({ c: sql<number>`count(*)` })
      .from(players)
    const [t] = await db
      .select({ c: sql<number>`count(*)` })
      .from(teams)
    const [c] = await db
      .select({ c: sql<number>`count(*)` })
      .from(coaches)
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
