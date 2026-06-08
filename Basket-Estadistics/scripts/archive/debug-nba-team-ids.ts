import { nbaAdapter } from "../../src/lib/sources/nba"
import { NBA_TEAM_CODES } from "../../src/lib/sources/nba-teams"
import { closeDb } from "../../src/lib/db/client"

async function main() {
  const stats = await nbaAdapter.fetchTeamStats()
  const ids = new Set(stats.map((s) => s.teamSourceId))
  const allIds = new Set(Object.values(NBA_TEAM_CODES).map(String))
  const missing = [...allIds].filter((id) => !ids.has(id))
  console.log("Total stats:", stats.length, "of", allIds.size)
  console.log("Missing:", missing)
  for (const id of missing) {
    const code = Object.keys(NBA_TEAM_CODES).find(
      (k) => String(NBA_TEAM_CODES[k]) === id,
    )
    console.log(`  ${id} (${code})`)
  }
  closeDb()
}
main().catch(console.error)
