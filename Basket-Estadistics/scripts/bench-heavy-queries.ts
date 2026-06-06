// Performance benchmark for the heavy data queries.
// Run with: pnpm exec tsx scripts/bench-heavy-queries.ts
//
// The cached() wrappers around single-record getters require a Next.js
// request context (unstable_cache needs incrementalCache), so we exercise
// the inner SQL paths directly. The wrapping itself only adds a key lookup
// and is the right call in production.
import { performance } from "node:perf_hooks"
import { and, desc, eq, sql } from "drizzle-orm"
import { getDb } from "../src/lib/db/client"
import {
  leagues,
  playerStats,
  players,
  seasons,
  teams,
  teamSeasonStats,
} from "../src/lib/db/schema"
import { listPlayers } from "../src/lib/data/players"
import { listTeams } from "../src/lib/data/teams"

type Probe = () => Promise<unknown>

async function bench(name: string, fn: Probe, n = 5): Promise<number> {
  const samples: number[] = []
  for (let i = 0; i < n; i++) {
    const start = performance.now()
    await fn()
    samples.push(performance.now() - start)
  }
  samples.sort((a, b) => a - b)
  const median = samples[Math.floor(samples.length / 2)]
  const min = samples[0]
  const max = samples[samples.length - 1]
  console.log(
    `${name.padEnd(44)} median=${median.toFixed(1).padStart(7)}ms  min=${min.toFixed(1).padStart(6)}ms  max=${max.toFixed(1).padStart(6)}ms  (n=${n})`,
  )
  return median
}

async function rawGetPlayerBySlug(slug: string) {
  const db = getDb()
  const rows = await db
    .select({
      id: players.id,
      fullName: players.fullName,
      slug: players.slug,
      leagueId: leagues.id,
    })
    .from(players)
    .innerJoin(leagues, eq(players.source, leagues.source))
    .leftJoin(teams, eq(players.currentTeamId, teams.id))
    .where(eq(players.slug, slug))
    .limit(1)
  if (!rows[0]) return null
  const r = rows[0]
  const statRows = await db
    .select({
      seasonId: seasons.id,
      year: seasons.year,
      gamesPlayed: playerStats.gamesPlayed,
    })
    .from(playerStats)
    .innerJoin(seasons, eq(playerStats.seasonId, seasons.id))
    .where(
      and(eq(playerStats.playerId, r.id), eq(seasons.leagueId, r.leagueId)),
    )
    .orderBy(desc(seasons.year))
  return { profile: r, seasons: statRows }
}

async function rawGetTeamBySlug(leagueSlug: string, slug: string) {
  const db = getDb()
  const rows = await db
    .select({
      id: teams.id,
      name: teams.name,
      leagueId: leagues.id,
    })
    .from(teams)
    .innerJoin(leagues, eq(teams.leagueId, leagues.id))
    .where(and(eq(leagues.slug, leagueSlug), eq(teams.slug, slug)))
    .limit(1)
  if (!rows[0]) return null
  const r = rows[0]
  const [rosterCount, seasonStats] = await Promise.all([
    db
      .select({ c: sql<number>`count(*)` })
      .from(players)
      .where(eq(players.currentTeamId, r.id)),
    db
      .select({
        seasonId: teamSeasonStats.seasonId,
        year: seasons.year,
        gamesPlayed: teamSeasonStats.gamesPlayed,
      })
      .from(teamSeasonStats)
      .innerJoin(seasons, eq(teamSeasonStats.seasonId, seasons.id))
      .where(
        and(eq(teamSeasonStats.teamId, r.id), eq(seasons.leagueId, r.leagueId)),
      )
      .orderBy(desc(seasons.year))
      .limit(1),
  ])
  return { team: r, rosterCount: rosterCount[0]?.c, stats: seasonStats[0] }
}

async function main() {
  getDb()
  console.log("== heavy query benchmarks (local sqlite, full dataset) ==\n")

  await bench("listPlayers (page 1, all leagues, points desc)", () =>
    listPlayers({ page: 1, pageSize: 30, sort: "points", order: "desc" }),
  )
  await bench("listPlayers (league=nba, sort=assists)", () =>
    listPlayers({
      league: "nba",
      sort: "assists",
      order: "desc",
      pageSize: 30,
    }),
  )
  await bench("listPlayers (search 'luka', all leagues)", () =>
    listPlayers({ query: "luka", pageSize: 30 }),
  )

  await bench("listTeams (all leagues, sort=name asc)", () =>
    listTeams({ sort: "name", order: "asc", pageSize: 24 }),
  )
  await bench("listTeams (league=nba, sort=wins desc)", () =>
    listTeams({ league: "nba", sort: "wins", order: "desc", pageSize: 24 }),
  )

  await bench("getPlayerBySlug (raw, nikola-jokic)", () =>
    rawGetPlayerBySlug("nikola-jokic"),
  )
  await bench("getPlayerBySlug (raw, luka-doncic)", () =>
    rawGetPlayerBySlug("luka-doncic"),
  )
  await bench("getTeamBySlug (raw, euroleague/real-madrid)", () =>
    rawGetTeamBySlug("euroleague", "real-madrid"),
  )
  await bench("getTeamBySlug (raw, nba/los-angeles-lakers)", () =>
    rawGetTeamBySlug("nba", "los-angeles-lakers"),
  )

  console.log(
    "\n* single-record getters run outside Next.js, so unstable_cache is bypassed",
  )
  console.log("  in production the cached() wrapper adds <1ms per call after the first.\n")
  console.log("== done ==")
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

