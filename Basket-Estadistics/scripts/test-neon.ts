import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import postgres from "postgres"
import { drizzle } from "drizzle-orm/postgres-js"
import { eq } from "drizzle-orm"
import * as schema from "../src/lib/db/schema"

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
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1)
        }
        if (!process.env[key]) process.env[key] = value
      }
    } catch {
      // file not found, skip
    }
  }
}

loadEnv()

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  console.error("ERROR: DATABASE_URL not found in .env or .env.local")
  process.exit(1)
}

const redacted = DATABASE_URL.replace(/:[^:@]+@/, ":***@")
console.log(`Connecting to: ${redacted}`)

async function main() {
  const sql = postgres(DATABASE_URL!, { prepare: false })
  const db = drizzle(sql, { schema })

  try {
    console.log("1. Inserting test league...")
    await db.insert(schema.leagues).values({
      name: "ACB Test",
      slug: "acb-test",
      region: "Europe",
    })
    console.log("   OK - Inserted")

    console.log("2. Selecting test league...")
    const [row] = await db
      .select()
      .from(schema.leagues)
      .where(eq(schema.leagues.slug, "acb-test"))
    if (!row) throw new Error("Row not found after insert")
    console.log(`   OK - Found: id=${row.id}, name="${row.name}", slug="${row.slug}", region="${row.region}"`)

    console.log("3. Cleaning up test league...")
    await db.delete(schema.leagues).where(eq(schema.leagues.slug, "acb-test"))
    console.log("   OK - Deleted")

    console.log("\nSUCCESS - Read/write to Neon working perfectly")
  } finally {
    await sql.end()
  }
}

main().catch((err) => {
  console.error(`FAILED: ${err.message}`)
  process.exit(1)
})
