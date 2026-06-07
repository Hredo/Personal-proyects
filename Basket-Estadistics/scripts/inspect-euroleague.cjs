// Inspect EuroLeague data completeness
import path from "node:path"
import Database from "better-sqlite3"

const __dirname = new URL(".", import.meta.url).pathname.replace(/^\/(\w):/, "$1:")
const dbPath = path.join(__dirname, "..", "data", "basket.db")
const db = new Database(dbPath, { readonly: true })

function get(sql, params = []) {
  return db.prepare(sql).all(...params)
}
function get1(sql, params = []) {
  return db.prepare(sql).get(...params)
}

const el = get1("SELECT * FROM leagues WHERE slug = 'euroleague'")
console.log("=== EuroLeague league row ===")
console.log(el)

const teams = get(
  "SELECT id, slug, name, league_id, logo_url, primary_color, city, arena FROM teams WHERE league_id = ? ORDER BY name",
  [el.id],
)
console.log(`\n=== EuroLeague teams (${teams.length}) ===`)
const tMissing = { logo: 0, color: 0, city: 0, arena: 0 }
for (const t of teams) {
  if (!t.logo_url) tMissing.logo++
  if (!t.primary_color) tMissing.color++
  if (!t.city) tMissing.city++
  if (!t.arena) tMissing.arena++
}
console.log("Missing:", tMissing)
console.log(
  "Sample slugs:",
  teams
    .slice(0, 5)
    .map((t) => t.slug)
    .join(", "),
)

const players = get(
  "SELECT id, slug, full_name, photo_url, position, nationality, birthdate, height_cm, weight_kg, current_team_id FROM players WHERE source = 'euroleague'",
)
console.log(`\n=== EuroLeague players (${players.length}) ===`)
const pMissing = {
  photo: 0,
  position: 0,
  nationality: 0,
  birthdate: 0,
  height: 0,
  weight: 0,
  currentTeam: 0,
}
for (const p of players) {
  if (!p.photo_url) pMissing.photo++
  if (!p.position) pMissing.position++
  if (!p.nationality) pMissing.nationality++
  if (!p.birthdate) pMissing.birthdate++
  if (!p.height_cm) pMissing.height++
  if (!p.weight_kg) pMissing.weight++
  if (!p.current_team_id) pMissing.currentTeam++
}
console.log("Missing:", pMissing)

const stats = get1(
  `
  SELECT COUNT(*) as total,
    SUM(CASE WHEN points IS NULL THEN 1 ELSE 0 END) as no_points,
    SUM(CASE WHEN games_played IS NULL OR games_played = 0 THEN 1 ELSE 0 END) as no_gp,
    SUM(CASE WHEN minutes_per_game IS NULL THEN 1 ELSE 0 END) as no_mpg,
    SUM(CASE WHEN rebounds IS NULL THEN 1 ELSE 0 END) as no_reb,
    SUM(CASE WHEN assists IS NULL THEN 1 ELSE 0 END) as no_ast
  FROM player_stats ps
  JOIN seasons s ON s.id = ps.season_id
  WHERE s.league_id = ?
`,
  [el.id],
)
console.log(`\n=== EuroLeague player_stats ===`)
console.log(stats)

const coaches = get(
  "SELECT full_name, role, photo_url, nationality, age FROM coaches WHERE league_id = ?",
  [el.id],
)
console.log(`\n=== EuroLeague coaches (${coaches.length}) ===`)
const cMissing = { photo: 0, nationality: 0, age: 0 }
for (const c of coaches) {
  if (!c.photo_url) cMissing.photo++
  if (!c.nationality) cMissing.nationality++
  if (!c.age) cMissing.age++
}
console.log("Missing:", cMissing)

const tStats = get1(
  "SELECT COUNT(*) as total FROM team_season_stats ts JOIN seasons s ON s.id = ts.season_id WHERE s.league_id = ?",
  [el.id],
)
console.log(`\n=== EuroLeague team_season_stats rows: ${tStats.total} ===`)

const seasons = get(
  "SELECT * FROM seasons WHERE league_id = ? ORDER BY year DESC",
  [el.id],
)
console.log(`\n=== EuroLeague seasons (${seasons.length}) ===`)
console.log(seasons.map((s) => `${s.year} (${s.name})`).join(", "))

db.close()
