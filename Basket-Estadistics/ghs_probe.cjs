const Database = require("better-sqlite3")
const db = new Database("data/basket.db", { readonly: true })

console.log("USERS:")
try {
  const users = db.prepare("SELECT email, plan, role FROM users").all()
  for (const u of users) console.log(`  ${u.email} | plan=${u.plan} | role=${u.role}`)
} catch (e) { console.log("  err", e.message) }

const cols = ["points", "rebounds", "assists", "steals", "blocks", "turnovers", "fg_pct", "three_pct", "ft_pct", "minutes_per_game", "off_rtg", "def_rtg", "per"]
console.log("\nNULL counts per column by league (of total stat rows):")
const leagues = db.prepare("SELECT id, slug, source FROM leagues ORDER BY slug").all()
for (const l of leagues) {
  const total = db.prepare("SELECT count(*) c FROM player_stats ps JOIN seasons s ON s.id=ps.season_id WHERE s.league_id=?").get(l.id).c
  const nulls = cols.map((c) => {
    const n = db.prepare(`SELECT count(*) c FROM player_stats ps JOIN seasons s ON s.id=ps.season_id WHERE s.league_id=? AND ps.${c} IS NULL`).get(l.id).c
    return `${c}=${n}`
  })
  console.log(`  ${l.slug} (total ${total}): ${nulls.join(" ")}`)
}

console.log("\nSource-players with ZERO stat rows (appear empty in directory):")
for (const l of leagues) {
  const totalP = db.prepare("SELECT count(*) c FROM players WHERE source=?").get(l.source).c
  const noStats = db.prepare("SELECT count(*) c FROM players p WHERE p.source=? AND NOT EXISTS (SELECT 1 FROM player_stats ps WHERE ps.player_id=p.id)").get(l.source).c
  console.log(`  ${l.slug}: ${noStats}/${totalP} players have no stats at all`)
}

console.log("\nSample leb-oro stat rows:")
const sample = db.prepare("SELECT p.full_name, ps.points, ps.rebounds, ps.assists, ps.steals, ps.blocks, ps.fg_pct, ps.three_pct, ps.minutes_per_game, ps.games_played FROM player_stats ps JOIN players p ON p.id=ps.player_id JOIN seasons s ON s.id=ps.season_id JOIN leagues l ON l.id=s.league_id WHERE l.slug='leb-oro' LIMIT 4").all()
for (const r of sample) console.log("  ", JSON.stringify(r))
console.log("\nSample euroleague stat rows:")
const sample2 = db.prepare("SELECT p.full_name, ps.points, ps.rebounds, ps.assists, ps.minutes_per_game, ps.games_played FROM player_stats ps JOIN players p ON p.id=ps.player_id JOIN seasons s ON s.id=ps.season_id JOIN leagues l ON l.id=s.league_id WHERE l.slug='euroleague' LIMIT 4").all()
for (const r of sample2) console.log("  ", JSON.stringify(r))
db.close()
