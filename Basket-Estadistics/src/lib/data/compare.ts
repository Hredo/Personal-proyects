import { and, desc, eq } from "drizzle-orm"
import { getDb } from "@/lib/db/client"
import {
  leagues,
  playerSeasonStats,
  players,
  seasons,
  teams,
} from "@/lib/db/schema"
import { cached } from "@/lib/data/cache"

export type ComparePlayer = {
  id: string
  slug: string
  fullName: string
  imageUrl: string | null
  position: string | null
  nationality: string | null
  team: { id: string; name: string; slug: string; logoUrl: string | null } | null
  league: { id: string; name: string; slug: string; region: string }
  stats: {
    seasonId: string
    seasonName: string
    gamesPlayed: number
    pointsTotal: number | null
    reboundsTotal: number | null
    assistsTotal: number | null
    stealsTotal: number | null
    blocksTotal: number | null
    turnoversTotal: number | null
    per: number | null
  } | null
}

export const getPlayerForCompare = cached(
  async (slug: string): Promise<ComparePlayer | null> => {
  const db = getDb()
  const rows = await db
    .select({
      id: players.id,
      slug: players.slug,
      fullName: players.firstName,
      imageUrl: players.imageUrl,
      position: players.position,
      nationality: players.nationality,
      teamId: teams.id,
      teamName: teams.name,
      teamSlug: teams.slug,
      teamLogo: teams.logoUrl,
      leagueId: leagues.id,
      leagueName: leagues.name,
      leagueSlug: leagues.slug,
      leagueRegion: leagues.region,
    })
    .from(players)
    .innerJoin(playerSeasonStats, eq(playerSeasonStats.playerId, players.id))
    .innerJoin(leagues, eq(playerSeasonStats.leagueId, leagues.id))
    .leftJoin(teams, eq(playerSeasonStats.teamId, teams.id))
    .where(eq(players.slug, slug))
    .limit(1)

  const r = rows[0]
  if (!r) return null

  const statRows = await db
    .select({
      seasonId: seasons.id,
      seasonName: seasons.name,
      gamesPlayed: playerSeasonStats.gamesPlayed,
      pointsTotal: playerSeasonStats.pointsTotal,
      reboundsTotal: playerSeasonStats.reboundsTotal,
      assistsTotal: playerSeasonStats.assistsTotal,
      stealsTotal: playerSeasonStats.stealsTotal,
      blocksTotal: playerSeasonStats.blocksTotal,
      turnoversTotal: playerSeasonStats.turnoversTotal,
      per: playerSeasonStats.per,
    })
    .from(playerSeasonStats)
    .innerJoin(seasons, eq(playerSeasonStats.seasonId, seasons.id))
    .where(
      and(
        eq(playerSeasonStats.playerId, r.id),
        eq(playerSeasonStats.leagueId, r.leagueId),
      ),
    )
    .orderBy(desc(seasons.name))
    .limit(1)

  return {
    id: r.id,
    slug: r.slug,
    fullName: r.fullName,
    imageUrl: r.imageUrl,
    position: r.position,
    nationality: r.nationality,
    league: {
      id: r.leagueId,
      name: r.leagueName,
      slug: r.leagueSlug,
      region: r.leagueRegion,
    },
    team:
      r.teamId && r.teamName && r.teamSlug
        ? { id: r.teamId, name: r.teamName, slug: r.teamSlug, logoUrl: r.teamLogo }
        : null,
    stats: statRows[0] ?? null,
  }
  },
  "getPlayerForCompare",
  ["players", "player-season-stats"],
  3600,
)
