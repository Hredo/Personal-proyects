import { and, desc, eq } from "drizzle-orm"
import { getDb } from "@/lib/db/client"
import {
  leagues,
  playerStats,
  players,
  seasons,
  teams,
} from "@/lib/db/schema"
import { cached } from "@/lib/data/cache"

export type ComparePlayer = {
  id: string
  slug: string
  fullName: string
  photoUrl: string | null
  position: string | null
  nationality: string | null
  team: { id: string; name: string; slug: string; logoUrl: string | null } | null
  league: { id: string; name: string; slug: string; country: string }
  stats: {
    seasonId: string
    year: number
    gamesPlayed: number
    minutesPerGame: number | null
    points: number | null
    rebounds: number | null
    assists: number | null
    steals: number | null
    blocks: number | null
    turnovers: number | null
    fgPct: number | null
    threePct: number | null
    ftPct: number | null
  } | null
}

export const getPlayerForCompare = cached(
  async (slug: string): Promise<ComparePlayer | null> => {
  const db = getDb()
  const rows = await db
    .select({
      id: players.id,
      slug: players.slug,
      fullName: players.fullName,
      photoUrl: players.photoUrl,
      position: players.position,
      nationality: players.nationality,
      teamId: teams.id,
      teamName: teams.name,
      teamSlug: teams.slug,
      teamLogo: teams.logoUrl,
      leagueId: leagues.id,
      leagueName: leagues.name,
      leagueSlug: leagues.slug,
      leagueCountry: leagues.country,
    })
    .from(players)
    .innerJoin(leagues, eq(players.source, leagues.source))
    .leftJoin(teams, eq(players.currentTeamId, teams.id))
    .where(eq(players.slug, slug))
    .limit(1)

  const r = rows[0]
  if (!r) return null

  const statRows = await db
    .select({
      seasonId: seasons.id,
      year: seasons.year,
      gamesPlayed: playerStats.gamesPlayed,
      minutesPerGame: playerStats.minutesPerGame,
      points: playerStats.points,
      rebounds: playerStats.rebounds,
      assists: playerStats.assists,
      steals: playerStats.steals,
      blocks: playerStats.blocks,
      turnovers: playerStats.turnovers,
      fgPct: playerStats.fgPct,
      threePct: playerStats.threePct,
      ftPct: playerStats.ftPct,
    })
    .from(playerStats)
    .innerJoin(seasons, eq(playerStats.seasonId, seasons.id))
    .where(
      and(
        eq(playerStats.playerId, r.id),
        eq(seasons.leagueId, r.leagueId),
      ),
    )
    .orderBy(desc(seasons.year))
    .limit(1)

  return {
    id: r.id,
    slug: r.slug,
    fullName: r.fullName,
    photoUrl: r.photoUrl,
    position: r.position,
    nationality: r.nationality,
    league: {
      id: r.leagueId,
      name: r.leagueName,
      slug: r.leagueSlug,
      country: r.leagueCountry,
    },
    team:
      r.teamId && r.teamName && r.teamSlug
        ? {
            id: r.teamId,
            name: r.teamName,
            slug: r.teamSlug,
            logoUrl: r.teamLogo,
          }
        : null,
    stats: statRows[0] ?? null,
  }
  },
  "getPlayerForCompare",
  ["players", "player-stats"],
  3600,
)

