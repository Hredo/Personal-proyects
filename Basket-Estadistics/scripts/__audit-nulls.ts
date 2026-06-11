/* Temporary audit — safe to delete */
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import postgres from "postgres"

function loadEnv() {
  const raw = readFileSync(resolve(process.cwd(), ".env"), "utf8")
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^([A-Z_]+)=(.*)$/)
    if (!m) continue
    let v = m[2].trim()
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1)
    }
    process.env[m[1]] = v
  }
}

async function main() {
  loadEnv()
  const sql = postgres(process.env.DATABASE_URL!, { prepare: false, connect_timeout: 20 })
  try {
    console.log("── PLAYERS (with 2025-26/E2025 stats) ──")
    const playerNulls = await sql`
      with current_players as (
        select distinct pss.player_id, l.slug as league
        from player_season_stats pss
        join leagues l on l.id = pss.league_id
        join seasons s on s.id = pss.season_id
        where s.is_current
      )
      select cp.league,
        count(*)::int as total,
        count(*) filter (where p.image_url is null)::int as no_image,
        count(*) filter (where p.position is null)::int as no_position,
        count(*) filter (where p.height_cm is null)::int as no_height,
        count(*) filter (where p.weight_kg is null)::int as no_weight,
        count(*) filter (where p.nationality is null)::int as no_nationality
      from current_players cp
      join players p on p.id = cp.player_id
      group by cp.league order by cp.league
    `
    for (const r of playerNulls) {
      console.log(
        `${String(r.league).padEnd(10)} total=${String(r.total).padEnd(4)} img=${String(r.no_image).padEnd(4)} pos=${String(r.no_position).padEnd(4)} h=${String(r.no_height).padEnd(4)} w=${String(r.no_weight).padEnd(4)} nat=${r.no_nationality}`,
      )
    }

    console.log("\n── STATS (current seasons) — null shooting-adjacent fields ──")
    const statNulls = await sql`
      select l.slug as league,
        count(*)::int as rows,
        count(*) filter (where pss.minutes_total is null)::int as no_min,
        count(*) filter (where pss.per is null)::int as no_per,
        count(*) filter (where pss.true_shooting_pct is null)::int as no_ts,
        count(*) filter (where pss.plus_minus is null)::int as no_pm,
        count(*) filter (where pss.fouls_total is null)::int as no_fouls
      from player_season_stats pss
      join leagues l on l.id = pss.league_id
      join seasons s on s.id = pss.season_id
      where s.is_current
      group by l.slug order by l.slug
    `
    for (const r of statNulls) {
      console.log(
        `${String(r.league).padEnd(10)} rows=${String(r.rows).padEnd(4)} min=${String(r.no_min).padEnd(4)} per=${String(r.no_per).padEnd(4)} ts=${String(r.no_ts).padEnd(4)} pm=${String(r.no_pm).padEnd(4)} fouls=${r.no_fouls}`,
      )
    }

    console.log("\n── TEAMS (with current-season stats) ──")
    const teamNulls = await sql`
      with current_teams as (
        select distinct pss.team_id, l.slug as league
        from player_season_stats pss
        join leagues l on l.id = pss.league_id
        join seasons s on s.id = pss.season_id
        where s.is_current
      )
      select ct.league,
        count(*)::int as total,
        count(*) filter (where t.logo_url is null)::int as no_logo,
        count(*) filter (where t.city is null)::int as no_city
      from current_teams ct
      join teams t on t.id = ct.team_id
      group by ct.league order by ct.league
    `
    for (const r of teamNulls) {
      console.log(
        `${String(r.league).padEnd(10)} total=${String(r.total).padEnd(4)} logo=${String(r.no_logo).padEnd(4)} city=${r.no_city}`,
      )
    }

    console.log("\n── COACHES ──")
    const coachNulls = await sql`
      select l.slug as league,
        count(*)::int as total,
        count(*) filter (where c.photo_url is null)::int as no_photo,
        count(*) filter (where c.nationality is null)::int as no_nat,
        count(*) filter (where c.age is null)::int as no_age
      from coaches c
      join leagues l on l.id = c.league_id
      group by l.slug order by l.slug
    `
    for (const r of coachNulls) {
      console.log(
        `${String(r.league).padEnd(10)} total=${String(r.total).padEnd(4)} photo=${String(r.no_photo).padEnd(4)} nat=${String(r.no_nat).padEnd(4)} age=${r.no_age}`,
      )
    }

    console.log("\n── players table columns (check what exists) ──")
    const cols = await sql`
      select table_name, column_name from information_schema.columns
      where table_name in ('teams', 'player_season_stats')
        and table_schema = 'public'
      order by table_name, ordinal_position
    `
    const byTable = new Map<string, string[]>()
    for (const c of cols) {
      const list = byTable.get(c.table_name) ?? []
      list.push(c.column_name)
      byTable.set(c.table_name, list)
    }
    for (const [t, list] of byTable) console.log(`${t}: ${list.join(", ")}`)
  } finally {
    await sql.end()
  }
}

main().catch((e) => {
  console.error("AUDIT FAILED:", e?.message ?? e)
  process.exit(1)
})
