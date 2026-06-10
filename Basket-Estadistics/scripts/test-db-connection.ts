/**
 * Quick connection test for the Supabase PostgreSQL database.
 * Run: npx tsx scripts/test-db-connection.ts
 *
 * Exits with 0 on success, 1 on failure.
 */
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import postgres from "postgres"
import { drizzle } from "drizzle-orm/postgres-js"
import * as schema from "../src/lib/db/schema"

function loadEnv() {
  const paths = [".env.local", ".env"].map((f) => resolve(__dirname, "..", f))
  for (const p of paths) {
    try {
      const content = readFileSync(p, "utf-8")
      for (const line of content.split("\n")) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith("#")) continue
        const eq = trimmed.indexOf("=")
        if (eq === -1) continue
        const key = trimmed.slice(0, eq).trim()
        const value = trimmed.slice(eq + 1).trim()
        if (!process.env[key]) process.env[key] = value
      }
    } catch {
      // file not found, skip
    }
  }
}

loadEnv()
const DATABASE_URL = process.env.DATABASE_URL

async function main() {
  if (!DATABASE_URL) {
    console.error("❌ DATABASE_URL not found in .env or .env.local")
    process.exit(1)
  }

  const redacted = DATABASE_URL.replace(/:[^:@]+@/, ":***@")
  console.log(`Connecting to: ${redacted}`)

  const sql = postgres(DATABASE_URL, { prepare: false })

  // 1. Basic SELECT
  const [{ ok }] = await sql`SELECT 1 AS ok`
  console.log(`1. Basic SELECT: ${ok === 1 ? "PASS" : "FAIL"}`)

  // 2. List existing tables
  const tables = await sql<{ table_name: string }[]>`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name
  `
  console.log(`2. Tables in public schema: ${tables.length > 0 ? tables.map((r) => r.table_name).join(", ") : "(none)"}`)

  // 3. Test Drizzle ORM client
  const db = drizzle(sql, { schema })
  try {
    const result = await db.select({ value: schema.leagues.id }).from(schema.leagues).limit(1)
    console.log(`3. Drizzle ORM query on 'leagues' table: ${result.length > 0 ? `OK (found ${result.length} row)` : "OK (table exists, 0 rows)"}`)
  } catch {
    console.log("3. 'leagues' table does not exist yet (schema not pushed)")
  }

  await sql.end()
  console.log("\n✅ All connection tests passed!")
  process.exit(0)
}

main().catch((err) => {
  console.error("\n❌ Connection failed:")
  console.error(`  ${err.message}`)
  if (err.cause) console.error(`  Cause: ${err.cause}`)
  if (err.stack) {
    const lines = err.stack.split("\n").slice(1, 4).join("\n")
    console.error(`  Stack:\n${lines}`)
  }
  process.exit(1)
})
