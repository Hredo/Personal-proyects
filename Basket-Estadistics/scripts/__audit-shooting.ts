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
    const rows = await sql`
      select l.slug as league,
        count(*)::int as rows,
        count(*) filter (where pss.fg_made is null or pss.fg_attempted is null)::int as no_fg,
        count(*) filter (where pss.three_made is null or pss.three_attempted is null)::int as no_3p,
        count(*) filter (where pss.ft_made is null or pss.ft_attempted is null)::int as no_ft,
        count(*) filter (where pss.offensive_rebounds is null)::int as no_oreb,
        count(*) filter (where pss.steals_total is null)::int as no_stl,
        count(*) filter (where pss.blocks_total is null)::int as no_blk,
        count(*) filter (where pss.turnovers_total is null)::int as no_tov,
        count(*) filter (where pss.rebounds_total is null)::int as no_reb,
        count(*) filter (where pss.assists_total is null)::int as no_ast
      from player_season_stats pss
      join leagues l on l.id = pss.league_id
      join seasons s on s.id = pss.season_id
      where s.is_current
      group by l.slug order by l.slug
    `
    console.log("SHOOTING + COUNTING STATS NULLS (current seasons):")
    for (const r of rows) {
      console.log(
        `${String(r.league).padEnd(10)} rows=${String(r.rows).padEnd(4)} fg=${String(r.no_fg).padEnd(4)} 3p=${String(r.no_3p).padEnd(4)} ft=${String(r.no_ft).padEnd(4)} oreb=${String(r.no_oreb).padEnd(4)} stl=${String(r.no_stl).padEnd(4)} blk=${String(r.no_blk).padEnd(4)} tov=${String(r.no_tov).padEnd(4)} reb=${String(r.no_reb).padEnd(4)} ast=${r.no_ast}`,
      )
    }
  } finally {
    await sql.end()
  }
}

main().catch((e) => {
  console.error("AUDIT FAILED:", e?.message ?? e)
  process.exit(1)
})
