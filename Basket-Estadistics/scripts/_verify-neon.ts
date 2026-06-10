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
    } catch { /* skip */ }
  }
}

loadEnv()

async function main() {
  const db = postgres(process.env.DATABASE_URL!, { prepare: false })
  const tables = ["leagues","seasons","teams","players","coaches","team_season_stats","player_season_stats","users","sessions","conversations","messages","user_settings","user_api_keys","videos","sync_runs"]
  for (const t of tables) {
    const [r] = await db`select count(*)::int as c from ${db(t)}`
    console.log(String(r.c).padStart(6) + "  " + t)
  }
  await db.end()
}
main()
