/*
 * One-off cleanup approved by the user on 2026-06-11:
 *  1. Merge seasons duplicated by name (5x "2025-26", 2x "2024-25") and set
 *     is_current. Stats keep their league_id, so a player or club present in
 *     several leagues stays differentiated per league.
 *  2. Merge team entities duplicated WITHIN the same league (Panathinaikos
 *     exists twice for EuroLeague). Teams legitimately present in different
 *     leagues are never merged.
 * Backup of affected tables: data/__backup-2026-06-11/*.json
 */
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

const CURRENT_SEASON_NAMES = ["2025-26", "E2025"]

type Sql = ReturnType<typeof postgres>

async function mergeSeasons(sql: Sql) {
  const rows = await sql<{ id: string; name: string; stats: number }[]>`
    select s.id, s.name,
      (select count(*)::int from player_season_stats p where p.season_id = s.id) as stats
    from seasons s
    order by s.name, stats desc, s.id
  `
  const byName = new Map<string, { id: string; stats: number }[]>()
  for (const r of rows) {
    const list = byName.get(r.name) ?? []
    list.push({ id: r.id, stats: r.stats })
    byName.set(r.name, list)
  }

  for (const [name, list] of byName) {
    if (list.length < 2) continue
    const keeper = list[0]
    const dups = list.slice(1)
    console.log(
      `[seasons] "${name}": keeping ${keeper.id} (${keeper.stats} stats), merging ${dups.length} duplicate(s)`,
    )
    for (const dup of dups) {
      // Same player+team+league exists on both sides: keep the fresher line
      // (more games played) on the keeper season, then drop the dup copy.
      await sql`
        update player_season_stats k
        set games_played = d.games_played,
            minutes_total = d.minutes_total,
            points_total = d.points_total,
            rebounds_total = d.rebounds_total,
            assists_total = d.assists_total,
            steals_total = d.steals_total,
            blocks_total = d.blocks_total,
            turnovers_total = d.turnovers_total,
            fouls_total = d.fouls_total,
            plus_minus = d.plus_minus,
            per = d.per,
            true_shooting_pct = d.true_shooting_pct,
            win_shares = d.win_shares,
            bpm = d.bpm
        from player_season_stats d
        where k.season_id = ${keeper.id} and d.season_id = ${dup.id}
          and k.player_id = d.player_id and k.team_id = d.team_id
          and k.league_id = d.league_id
          and d.games_played > k.games_played
      `
      await sql`
        delete from player_season_stats d
        using player_season_stats k
        where d.season_id = ${dup.id} and k.season_id = ${keeper.id}
          and d.player_id = k.player_id and d.team_id = k.team_id
          and d.league_id = k.league_id
      `
      await sql`
        update player_season_stats set season_id = ${keeper.id}
        where season_id = ${dup.id}
      `
      await sql`
        delete from team_season_stats d
        using team_season_stats k
        where d.season_id = ${dup.id} and k.season_id = ${keeper.id}
          and d.team_id = k.team_id and d.league_id = k.league_id
      `
      await sql`
        update team_season_stats set season_id = ${keeper.id}
        where season_id = ${dup.id}
      `
      await sql`delete from seasons where id = ${dup.id}`
      console.log(`[seasons]   merged ${dup.id} (${dup.stats} stats) -> keeper`)
    }
  }

  await sql`
    update seasons set is_current = (name in ${sql(CURRENT_SEASON_NAMES)})
  `
  console.log(`[seasons] is_current set for: ${CURRENT_SEASON_NAMES.join(", ")}`)
}

async function mergeSameLeagueDupTeams(sql: Sql) {
  // Teams sharing a normalized name AND a league in stats are duplicates of
  // one club inside that league. Same-named clubs in different leagues are
  // intentionally distinct and never matched here.
  const groups = await sql<
    { lname: string; ids: string[]; stat_counts: number[] }[]
  >`
    with team_league as (
      select distinct pss.team_id, pss.league_id from player_season_stats pss
    ),
    name_league as (
      select lower(t.name) as lname, tl.league_id,
        array_agg(distinct t.id::text) as ids
      from teams t
      join team_league tl on tl.team_id = t.id
      group by lower(t.name), tl.league_id
      having count(distinct t.id) > 1
    )
    select nl.lname,
      nl.ids,
      array(
        select (select count(*)::int from player_season_stats p where p.team_id = x.id::uuid)
        from unnest(nl.ids) as x(id)
      ) as stat_counts
    from name_league nl
  `

  if (groups.length === 0) {
    console.log("[teams] no same-league duplicate teams found")
    return
  }

  for (const g of groups) {
    const ranked = g.ids
      .map((id, i) => ({ id, stats: g.stat_counts[i] ?? 0 }))
      .sort((a, b) => b.stats - a.stats)
    const keeper = ranked[0]
    const dups = ranked.slice(1)
    console.log(
      `[teams] "${g.lname}": keeping ${keeper.id} (${keeper.stats} stats), merging ${dups.map((d) => d.id).join(", ")}`,
    )

    for (const dup of dups) {
      // Fill keeper metadata gaps from the dup before dropping it.
      await sql`
        update teams k
        set city = coalesce(k.city, d.city),
            logo_url = coalesce(k.logo_url, d.logo_url)
        from teams d
        where k.id = ${keeper.id} and d.id = ${dup.id}
      `

      // For each (player, league, season) present on both sides keep the line
      // with more games (then more points), wherever it lives.
      await sql`
        with both_rows as (
          select id, player_id, league_id, season_id,
            row_number() over (
              partition by player_id, league_id, season_id
              order by coalesce(games_played, 0) desc,
                coalesce(points_total, 0) desc, id
            ) as rn
          from player_season_stats
          where team_id in (${keeper.id}, ${dup.id})
        )
        delete from player_season_stats
        where id in (select id from both_rows where rn > 1)
      `
      await sql`
        update player_season_stats set team_id = ${keeper.id}
        where team_id = ${dup.id}
      `

      await sql`
        with both_rows as (
          select id,
            row_number() over (
              partition by season_id, league_id
              order by coalesce(games_played, 0) desc, id
            ) as rn
          from team_season_stats
          where team_id in (${keeper.id}, ${dup.id})
        )
        delete from team_season_stats
        where id in (select id from both_rows where rn > 1)
      `
      await sql`
        update team_season_stats set team_id = ${keeper.id}
        where team_id = ${dup.id}
      `

      await sql`
        delete from coaches d
        using coaches k
        where d.team_id = ${dup.id} and k.team_id = ${keeper.id}
          and d.league_id = k.league_id and d.slug = k.slug
      `
      await sql`
        update coaches set team_id = ${keeper.id} where team_id = ${dup.id}
      `

      await sql`delete from teams where id = ${dup.id}`
      console.log(`[teams]   merged ${dup.id} -> ${keeper.id}`)
    }
  }
}

async function report(sql: Sql) {
  const seasons = await sql<
    { name: string; is_current: boolean; stats: number }[]
  >`
    select s.name, s.is_current,
      (select count(*)::int from player_season_stats p where p.season_id = s.id) as stats
    from seasons s order by s.name
  `
  console.log("\n[final] seasons:")
  for (const s of seasons) {
    console.log(`  ${s.name.padEnd(10)} current=${s.is_current} stats=${s.stats}`)
  }

  const dupTeams = await sql<{ c: number }[]>`
    select count(*)::int as c from (
      select 1
      from teams t
      join (select distinct team_id, league_id from player_season_stats) tl
        on tl.team_id = t.id
      group by lower(t.name), tl.league_id
      having count(distinct t.id) > 1
    ) x
  `
  console.log(`[final] same-league duplicate team groups: ${dupTeams[0].c}`)

  const sameSeason = await sql<{ league: string; groups: number }[]>`
    select l.slug as league, count(*)::int as groups from (
      select pss.league_id, pss.player_id, pss.season_id, pss.team_id
      from player_season_stats pss
      group by pss.league_id, pss.player_id, pss.season_id, pss.team_id
      having count(*) > 1
    ) d
    join leagues l on l.id = d.league_id
    group by l.slug
  `
  console.log(
    `[final] exact same (player, team, league, season) dup groups: ${sameSeason.length === 0 ? "none" : JSON.stringify(sameSeason)}`,
  )

  const transfers = await sql<{ c: number }[]>`
    select count(*)::int as c from (
      select pss.league_id, pss.player_id, pss.season_id
      from player_season_stats pss
      group by pss.league_id, pss.player_id, pss.season_id
      having count(*) > 1
    ) x
  `
  console.log(
    `[final] multi-team rows per (player, league, season) kept (transfers): ${transfers[0].c}`,
  )
}

async function main() {
  loadEnv()
  const sql = postgres(process.env.DATABASE_URL!, {
    prepare: false,
    connect_timeout: 20,
  })
  try {
    await sql.begin(async (tx) => {
      await mergeSeasons(tx as unknown as Sql)
      await mergeSameLeagueDupTeams(tx as unknown as Sql)
    })
    await report(sql)
  } finally {
    await sql.end()
  }
}

main().catch((e) => {
  console.error("CLEANUP FAILED:", e?.message ?? e)
  process.exit(1)
})
