/*
 * Applies exactly the additive statements drizzle-kit push displayed
 * (reviewed: 5x ADD COLUMN on teams, no data loss). Safe to delete after.
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

async function main() {
  loadEnv()
  const sql = postgres(process.env.DATABASE_URL!, { prepare: false, connect_timeout: 20 })
  try {
    await sql`alter table teams add column if not exists founded_year integer`
    await sql`alter table teams add column if not exists website text`
    await sql`alter table teams add column if not exists arena text`
    await sql`alter table teams add column if not exists primary_color text`
    await sql`alter table teams add column if not exists secondary_color text`
    const cols = await sql`
      select column_name from information_schema.columns
      where table_name = 'teams' and table_schema = 'public'
      order by ordinal_position
    `
    console.log("teams columns:", cols.map((c) => c.column_name).join(", "))
  } finally {
    await sql.end()
  }
}

main().catch((e) => {
  console.error("FAILED:", e?.message ?? e)
  process.exit(1)
})
