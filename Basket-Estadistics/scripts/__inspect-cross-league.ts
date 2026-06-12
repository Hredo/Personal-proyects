/* Temporary inspection — safe to delete */
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
    const combos = await sql`
      with pl as (
        select pss.player_id, array_agg(distinct l.slug order by l.slug) as leagues
        from player_season_stats pss
        join leagues l on l.id = pss.league_id
        group by pss.player_id
        having count(distinct l.slug) > 1
      )
      select leagues, count(*)::int as players
      from pl group by leagues order by players desc
    `
    console.log("PLAYERS WITH STATS IN MULTIPLE LEAGUES:")
    for (const c of combos) console.log(`  ${c.leagues.join(" + ")}: ${c.players}`)

    const nbaFeb = await sql`
      with pl as (
        select pss.player_id, array_agg(distinct l.slug order by l.slug) as leagues
        from player_season_stats pss
        join leagues l on l.id = pss.league_id
        group by pss.player_id
        having count(distinct l.slug) > 1
      )
      select p.slug, p.first_name || ' ' || p.last_name as name, pl.leagues,
        p.image_url like '%imagenes.feb.es%' as feb_image
      from pl
      join players p on p.id = pl.player_id
      where pl.leagues && array['eba','leb-oro','leb-plata']::text[]
      order by p.slug
      limit 40
    `
    console.log(`\nFEB + OTHER LEAGUE MERGES (first 40):`)
    for (const r of nbaFeb) {
      console.log(`  ${String(r.slug).padEnd(38)} ${String(r.name).padEnd(28)} ${r.leagues.join("+")} febimg=${r.feb_image}`)
    }

    const [pollution] = await sql`
      select count(*)::int as c
      from players p
      where p.image_url like '%imagenes.feb.es%'
        and exists (
          select 1 from player_season_stats pss
          join leagues l on l.id = pss.league_id
          where pss.player_id = p.id and l.slug in ('nba','euroleague','acb')
        )
    `
    console.log(`\nPlayers in NBA/EL/ACB wearing a FEB photo: ${pollution.c}`)

    const slugPrefixes = await sql`
      select coalesce(substring(p.slug from '^(nba|euroleague|acb|leb-oro|leb-plata|eba)-'), '(none)') as prefix,
        count(*)::int as c
      from players p group by 1 order by c desc
    `
    console.log("\nSLUG PREFIX DISTRIBUTION:")
    for (const r of slugPrefixes) console.log(`  ${r.prefix}: ${r.c}`)
  } finally {
    await sql.end()
  }
}

main().catch((e) => {
  console.error("FAILED:", e?.message ?? e)
  process.exit(1)
})
