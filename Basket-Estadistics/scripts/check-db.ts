import Database from "better-sqlite3"

const db = new Database("./data/basket.db")
const tables = db
  .prepare("SELECT name FROM sqlite_master WHERE type='table'")
  .all()
console.log("Tables:", tables)
const leagues = db.prepare("SELECT name, source FROM leagues").all()
console.log("Leagues:", leagues)
const counts = {
  teams: db.prepare("SELECT count(*) as c FROM teams").get(),
  players: db.prepare("SELECT count(*) as c FROM players").get(),
  playerStats: db.prepare("SELECT count(*) as c FROM player_stats").get(),
  coaches: db.prepare("SELECT count(*) as c FROM coaches").get(),
  teamSeasonStats: db
    .prepare("SELECT count(*) as c FROM team_season_stats")
    .get(),
}
console.log("Counts:", counts)
db.close()
