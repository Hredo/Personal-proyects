import Database from "better-sqlite3"
const db = new Database("data/basket.db")

// Test query: with dedup using subquery (SQLite doesn't have QUALIFY)
const sql1 = `
  with memberships as (
    select ps.player_id, s.league_id, ps.team_id,
           ps.games_played, ps.points, ps.rebounds, ps.assists
    from player_stats ps
    inner join seasons s on s.id = ps.season_id

    union all

    select p.id as player_id, l_src.id as league_id, p.current_team_id as team_id,
           null as games_played, null as points, null as rebounds, null as assists
    from players p
    inner join leagues l_src on l_src.source = p.source
    where not exists (select 1 from player_stats ps2 where ps2.player_id = p.id)
  ),
  ranked as (
    select
      p.id as player_id, p.full_name, p.photo_url, p.nationality, p.position, p.updated_at,
      m.league_id, m.team_id, m.games_played, m.points,
      row_number() over (
        partition by lower(p.full_name)
        order by
          coalesce(m.games_played, 0) desc,
          case when p.photo_url is not null then 0 else 1 end,
          case when p.nationality is not null then 0 else 1 end,
          case when p.position is not null then 0 else 1 end,
          p.updated_at desc
      ) as rn
    from memberships m
    inner join players p on p.id = m.player_id
    where lower(coalesce((select name from teams t where t.id = m.team_id), '')) like '%real madrid%'
  )
  select
    r.full_name, l.name as league, t.name as team,
    r.games_played, r.points
  from ranked r
  inner join leagues l on l.id = r.league_id
  left join teams t on t.id = r.team_id
  where r.rn = 1
  order by r.points desc nulls last
`

const rows = db.prepare(sql1).all()
console.log(`Real Madrid players (all leagues, deduped): ${rows.length}`)
for (const r of rows) {
  console.log(
    `  ${r.full_name.padEnd(30)} | ${r.league.padEnd(15)} | ${(r.team || "-").padEnd(20)} | ${r.points ?? "—"} PPG`,
  )
}
db.close()
