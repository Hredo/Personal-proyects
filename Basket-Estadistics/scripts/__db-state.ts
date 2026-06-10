import { readFileSync } from "node:fs"
import { resolve } from "node:path"

function loadEnv() {
  const paths = [".env.local", ".env"].map((f) => resolve(__dirname, "..", f))
  for (const p of paths) {
    try {
      const content = readFileSync(p, "utf-8")
      for (const line of content.split("\n")) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith("#")) continue
        const eq = trimmed.indexOf("=")
        if (eq === -1) continue
        const key = trimmed.slice(0, eq).trim()
        const value = trimmed
          .slice(eq + 1)
          .trim()
          .replace(/^(["'])(.*)\1$/, "$2")
        if (!process.env[key]) process.env[key] = value
      }
    } catch {
      // file not found, skip
    }
  }
}
loadEnv()

async function main() {
  const { getDb, closeDb } = await import("@/lib/db/client")
  const { sql } = await import("drizzle-orm")
  const db = getDb()

  const tables = [
    "leagues",
    "seasons",
    "teams",
    "players",
    "player_season_stats",
    "coaches",
    "team_season_stats",
    "sync_runs",
  ]
  console.log("── row counts ──")
  for (const t of tables) {
    const rows = await db.execute(
      sql.raw(`SELECT count(*)::int AS n FROM "${t}"`),
    )
    console.log(`${t.padEnd(22)} ${(rows as unknown as { n: number }[])[0]?.n}`)
  }

  console.log("\n── stats rows per league/season ──")
  const perLeague = (await db.execute(
    sql.raw(`
      SELECT l.slug, s.name AS season, count(*)::int AS n
      FROM player_season_stats pss
      JOIN leagues l ON l.id = pss.league_id
      JOIN seasons s ON s.id = pss.season_id
      GROUP BY l.slug, s.name ORDER BY l.slug
    `),
  )) as unknown as { slug: string; season: string; n: number }[]
  for (const r of perLeague) console.log(`${r.slug.padEnd(12)} ${r.season.padEnd(10)} ${r.n}`)
  if (perLeague.length === 0) console.log("(none)")

  console.log("\n── players null fields ──")
  const pNulls = (await db.execute(
    sql.raw(`
      SELECT
        count(*)::int AS total,
        count(*) FILTER (WHERE position IS NULL)::int AS position,
        count(*) FILTER (WHERE height_cm IS NULL)::int AS height,
        count(*) FILTER (WHERE weight_kg IS NULL)::int AS weight,
        count(*) FILTER (WHERE nationality IS NULL)::int AS nationality,
        count(*) FILTER (WHERE image_url IS NULL)::int AS image,
        count(*) FILTER (WHERE bio IS NULL)::int AS bio
      FROM players
    `),
  )) as unknown as Record<string, number>[]
  console.log(JSON.stringify(pNulls[0]))

  console.log("\n── teams null fields ──")
  const tNulls = (await db.execute(
    sql.raw(`
      SELECT
        count(*)::int AS total,
        count(*) FILTER (WHERE city IS NULL)::int AS city,
        count(*) FILTER (WHERE logo_url IS NULL)::int AS logo
      FROM teams
    `),
  )) as unknown as Record<string, number>[]
  console.log(JSON.stringify(tNulls[0]))

  console.log("\n── coaches null fields ──")
  const cNulls = (await db.execute(
    sql.raw(`
      SELECT
        count(*)::int AS total,
        count(*) FILTER (WHERE nationality IS NULL)::int AS nationality,
        count(*) FILTER (WHERE age IS NULL)::int AS age,
        count(*) FILTER (WHERE photo_url IS NULL)::int AS photo
      FROM coaches
    `),
  )) as unknown as Record<string, number>[]
  console.log(JSON.stringify(cNulls[0]))

  console.log("\n── players null fields per league (current rosters) ──")
  const perLeagueNulls = (await db.execute(
    sql.raw(`
      SELECT l.slug,
        count(DISTINCT p.id)::int AS total,
        count(DISTINCT p.id) FILTER (WHERE p.position IS NULL)::int AS no_pos,
        count(DISTINCT p.id) FILTER (WHERE p.height_cm IS NULL)::int AS no_h,
        count(DISTINCT p.id) FILTER (WHERE p.weight_kg IS NULL)::int AS no_w,
        count(DISTINCT p.id) FILTER (WHERE p.nationality IS NULL)::int AS no_nat,
        count(DISTINCT p.id) FILTER (WHERE p.image_url IS NULL)::int AS no_img
      FROM players p
      JOIN player_season_stats pss ON pss.player_id = p.id
      JOIN leagues l ON l.id = pss.league_id
      GROUP BY l.slug ORDER BY l.slug
    `),
  )) as unknown as Record<string, string | number>[]
  for (const r of perLeagueNulls) console.log(JSON.stringify(r))

  console.log("\n── coaches per league ──")
  const coachLeague = (await db.execute(
    sql.raw(`
      SELECT l.slug, count(*)::int AS n,
        count(*) FILTER (WHERE c.nationality IS NULL)::int AS no_nat,
        count(*) FILTER (WHERE c.age IS NULL)::int AS no_age,
        count(*) FILTER (WHERE c.photo_url IS NULL)::int AS no_photo
      FROM coaches c JOIN leagues l ON l.id = c.league_id
      GROUP BY l.slug ORDER BY l.slug
    `),
  )) as unknown as Record<string, string | number>[]
  for (const r of coachLeague) console.log(JSON.stringify(r))

  console.log("\n── seasons rows ──")
  const seasonRows = (await db.execute(
    sql.raw(`
      SELECT s.id, s.name, s.is_current,
        (SELECT count(*)::int FROM player_season_stats p WHERE p.season_id = s.id) AS stats
      FROM seasons s ORDER BY s.name
    `),
  )) as unknown as {
    id: string
    name: string
    is_current: boolean
    stats: number
  }[]
  for (const s of seasonRows)
    console.log(
      `${s.id} ${s.name.padEnd(10)} current=${s.is_current} stats=${s.stats}`,
    )

  console.log("\n── suspicious -N suffixed team slugs ──")
  const dupTeams = (await db.execute(
    sql.raw(`
      SELECT t2.slug, t2.id,
        (SELECT count(*)::int FROM player_season_stats p WHERE p.team_id = t2.id) AS stats
      FROM teams t2
      WHERE t2.slug ~ '-[0-9]+$'
        AND EXISTS (
          SELECT 1 FROM teams b
          WHERE b.slug = regexp_replace(t2.slug, '-[0-9]+$', '')
        )
      ORDER BY t2.slug
    `),
  )) as unknown as { slug: string; id: string; stats: number }[]
  for (const t of dupTeams) console.log(`${t.slug.padEnd(30)} stats=${t.stats}`)
  if (dupTeams.length === 0) console.log("(none)")

  console.log("\n── last sync runs ──")
  const runs = (await db.execute(
    sql.raw(`
      SELECT source, status, rows_written, started_at
      FROM sync_runs ORDER BY started_at DESC LIMIT 10
    `),
  )) as unknown as {
    source: string
    status: string
    rows_written: number
    started_at: string
  }[]
  for (const r of runs)
    console.log(
      `${String(r.source).padEnd(12)} ${String(r.status).padEnd(8)} rows=${r.rows_written} ${r.started_at}`,
    )
  if (runs.length === 0) console.log("(none)")

  closeDb()
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
