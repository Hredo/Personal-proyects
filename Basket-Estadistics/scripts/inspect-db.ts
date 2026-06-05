import { getDb, closeDb } from "../src/lib/db/client"
import {
  coaches,
  players,
  playerStats,
  teams,
  leagues,
  teamSeasonStats,
} from "../src/lib/db/schema"
import { eq, sql } from "drizzle-orm"

async function main() {
  const db = getDb()
  const allLeagues = await db.select().from(leagues)
  console.log(
    "leagues:",
    allLeagues.map((l) => `${l.name} (${l.source})`),
  )
  for (const lg of allLeagues) {
    const tCount = await db
      .select({ c: sql<number>`count(*)` })
      .from(teams)
      .where(eq(teams.leagueId, lg.id))
    const pCount = await db
      .select({ c: sql<number>`count(*)` })
      .from(players)
      .where(eq(players.source, lg.source))
    const sCount = await db
      .select({ c: sql<number>`count(*)` })
      .from(playerStats)
      .innerJoin(players, eq(playerStats.playerId, players.id))
      .where(eq(players.source, lg.source))
    const cCount = await db
      .select({ c: sql<number>`count(*)` })
      .from(coaches)
      .where(eq(coaches.source, lg.source))
    const tsCount = await db
      .select({ c: sql<number>`count(*)` })
      .from(teamSeasonStats)
      .innerJoin(teams, eq(teamSeasonStats.teamId, teams.id))
      .where(eq(teams.leagueId, lg.id))
    console.log(
      `  ${lg.source}: ${tCount[0]?.c} teams, ${pCount[0]?.c} players, ${sCount[0]?.c} stats, ${cCount[0]?.c} coaches, ${tsCount[0]?.c} team_stats`,
    )
  }
  const sample = await db
    .select({
      league: leagues.name,
      name: players.fullName,
      team: teams.name,
      pos: players.position,
      pts: playerStats.points,
      reb: playerStats.rebounds,
      ast: playerStats.assists,
      gp: playerStats.gamesPlayed,
    })
    .from(playerStats)
    .innerJoin(players, eq(playerStats.playerId, players.id))
    .leftJoin(teams, eq(players.currentTeamId, teams.id))
    .leftJoin(leagues, eq(teams.leagueId, leagues.id))
    .where(eq(players.source, "euroleague"))
    .orderBy(sql`${playerStats.points} DESC NULLS LAST`)
    .limit(5)
  console.log("\nTop 5 EuroLeague scorers:")
  for (const r of sample) {
    console.log(
      `  ${r.name} (${r.team ?? "FA"}, ${r.pos ?? "?"}) — ${r.pts} PPG, ${r.reb} RPG, ${r.ast} APG, ${r.gp} GP`,
    )
  }
  closeDb()
}
main().catch(console.error)
