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

export type CompareStats = {
  seasonId: string
  seasonName: string
  gamesPlayed: number
  pointsTotal: number | null
  reboundsTotal: number | null
  offensiveRebounds: number | null
  defensiveRebounds: number | null
  assistsTotal: number | null
  stealsTotal: number | null
  blocksTotal: number | null
  fgPct: number | null
  threePct: number | null
  ftPct: number | null
  fgMade: number | null
  fgAttempted: number | null
  threeMade: number | null
  threeAttempted: number | null
  ftMade: number | null
  ftAttempted: number | null
  minutesTotal: number | null
  foulsTotal: number | null
  plusMinus: number | null
  per: number | null
}

export type ComparePlayer = {
  id: string
  slug: string
  fullName: string
  imageUrl: string | null
  position: string | null
  nationality: string | null
  team: { id: string; name: string; slug: string; logoUrl: string | null } | null
  league: { id: string; name: string; slug: string; region: string }
  stats: CompareStats | null
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
      offensiveRebounds: playerSeasonStats.offensiveRebounds,
      defensiveRebounds: playerSeasonStats.defensiveRebounds,
      assistsTotal: playerSeasonStats.assistsTotal,
      stealsTotal: playerSeasonStats.stealsTotal,
      blocksTotal: playerSeasonStats.blocksTotal,
      fgMade: playerSeasonStats.fgMade,
      fgAttempted: playerSeasonStats.fgAttempted,
      threeMade: playerSeasonStats.threeMade,
      threeAttempted: playerSeasonStats.threeAttempted,
      ftMade: playerSeasonStats.ftMade,
      ftAttempted: playerSeasonStats.ftAttempted,
      minutesTotal: playerSeasonStats.minutesTotal,
      foulsTotal: playerSeasonStats.foulsTotal,
      plusMinus: playerSeasonStats.plusMinus,
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
    stats: statRows[0]
      ? {
          ...statRows[0],
          fgPct: statRows[0].fgMade != null && statRows[0].fgAttempted != null && statRows[0].fgAttempted > 0
            ? statRows[0].fgMade / statRows[0].fgAttempted
            : null,
          threePct: statRows[0].threeMade != null && statRows[0].threeAttempted != null && statRows[0].threeAttempted > 0
            ? statRows[0].threeMade / statRows[0].threeAttempted
            : null,
          ftPct: statRows[0].ftMade != null && statRows[0].ftAttempted != null && statRows[0].ftAttempted > 0
            ? statRows[0].ftMade / statRows[0].ftAttempted
            : null,
        }
      : null,
  }
  },
  "getPlayerForCompare",
  ["players", "player-season-stats"],
  3600,
)
