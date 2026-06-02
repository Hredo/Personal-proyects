const Database = require("better-sqlite3")
const db = new Database("data/basket.db", { readonly: false })
const tables = db
  .prepare("select name from sqlite_master where type='table' order by name")
  .all()
console.log("tables:", tables.map((t) => t.name).join(", ") || "(empty)")
const counts = ["leagues", "teams", "players", "player_stats", "coaches", "team_season_stats"]
for (const t of counts) {
  try {
    const r = db.prepare(`select count(*) c from ${t}`).get()
    console.log(`${t}: ${r.c}`)
  } catch (e) {
    console.log(`${t}: error - ${e.message}`)
  }
}
db.close()
