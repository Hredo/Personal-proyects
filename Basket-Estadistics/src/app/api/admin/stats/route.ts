import { NextResponse } from "next/server"
import { sql } from "drizzle-orm"
import { getDb } from "@/lib/db/client"
import { getCurrentUser, isAdmin } from "@/lib/auth/current-user"

export async function GET(request: Request) {
  const user = await getCurrentUser(request.headers.get("cookie"))
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!isAdmin(user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const db = getDb()

  const tables = [
    "leagues", "seasons", "teams", "players",
    "player_season_stats", "coaches", "team_season_stats", "sync_runs",
  ] as const

  const rowCounts: Record<string, number> = {}
  for (const t of tables) {
    const [r] = await db.execute(sql.raw(`SELECT count(*)::int AS n FROM "${t}"`))
    rowCounts[t] = (r as { n: number }).n ?? 0
  }

  const [leaguesStats] = await db.execute(sql.raw(`
    SELECT l.slug, l.name,
      count(DISTINCT pss.player_id)::int AS players,
      count(DISTINCT pss.team_id)::int AS teams,
      count(DISTINCT pss.season_id)::int AS seasons,
      count(*)::int AS stat_rows
    FROM player_season_stats pss
    JOIN leagues l ON l.id = pss.league_id
    GROUP BY l.slug, l.name ORDER BY l.slug
  `))

  const [lastSync] = await db.execute(sql.raw(`
    SELECT source, status, rows_written, started_at, finished_at
    FROM sync_runs ORDER BY started_at DESC LIMIT 15
  `))

  const [nulls] = await db.execute(sql.raw(`
    SELECT
      (SELECT count(*)::int FROM players) AS total_players,
      (SELECT count(*)::int FROM players WHERE position IS NULL) AS no_position,
      (SELECT count(*)::int FROM players WHERE height_cm IS NULL) AS no_height,
      (SELECT count(*)::int FROM players WHERE weight_kg IS NULL) AS no_weight,
      (SELECT count(*)::int FROM players WHERE nationality IS NULL) AS no_nationality,
      (SELECT count(*)::int FROM players WHERE image_url IS NULL) AS no_image,
      (SELECT count(*)::int FROM teams WHERE city IS NULL) AS teams_no_city,
      (SELECT count(*)::int FROM teams WHERE logo_url IS NULL) AS teams_no_logo
  `))

  const [seasonStats] = await db.execute(sql.raw(`
    SELECT l.slug, s.name AS season, count(*)::int AS n
    FROM player_season_stats pss
    JOIN leagues l ON l.id = pss.league_id
    JOIN seasons s ON s.id = pss.season_id
    GROUP BY l.slug, s.name ORDER BY l.slug, s.name
  `))

  return NextResponse.json({
    rowCounts,
    leaguesStats: leaguesStats as unknown as { slug: string; name: string; players: number; teams: number; seasons: number; stat_rows: number }[],
    lastSync: lastSync as unknown as { source: string; status: string; rows_written: number; started_at: string; finished_at: string | null }[],
    nulls: (nulls as unknown as Record<string, number>[])[0] ?? {},
    seasonStats: seasonStats as unknown as { slug: string; season: string; n: number }[],
  })
}
