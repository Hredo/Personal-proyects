import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import postgres from "postgres"

function loadEnv() {
  const paths = [".env.local", ".env"].map((f) => resolve(__dirname, "..", f))
  for (const p of paths) {
    try {
      const content = readFileSync(p, "utf-8")
      for (const line of content.split("\n")) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith("#")) continue
        const eqIdx = trimmed.indexOf("=")
        if (eqIdx === -1) continue
        const key = trimmed.slice(0, eqIdx).trim()
        let value = trimmed.slice(eqIdx + 1).trim()
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1)
        if (!process.env[key]) process.env[key] = value
      }
    } catch { }
  }
}
loadEnv()

async function main() {
  const sql = postgres(process.env.DATABASE_URL!, { prepare: false })

  // Delete in reverse FK dependency order
  const tables = [
    "compare_uses", "shortlist_players", "shortlists", "waitlist_entries",
    "messages", "conversations", "sessions", "user_api_keys", "user_settings",
    "videos", "player_season_stats", "team_season_stats", "coaches",
    "players", "teams", "seasons", "leagues",
  ]
  for (const t of tables) {
    await sql`delete from ${sql(t)}`
    console.log(`  Cleared ${t}`)
  }
  console.log("All tables truncated.")
  await sql.end()
}
main().catch(console.error)
