import { nbaAdapter } from "../../src/lib/sources/nba"
import { closeDb } from "../../src/lib/db/client"

async function main() {
  console.log("Fetching NBA team stats...")
  const stats = await nbaAdapter.fetchTeamStats()
  console.log("Got", stats.length, "team stats")
  for (const s of stats.slice(0, 5)) {
    console.log(JSON.stringify(s))
  }
  closeDb()
}
main().catch(console.error)
