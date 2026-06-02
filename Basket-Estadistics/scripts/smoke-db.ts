import { getDb, closeDb } from "../src/lib/db/client"
import { leagues } from "../src/lib/db/schema"

async function main() {
  const db = getDb()
  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  await db.insert(leagues).values({
    id,
    name: "Test League",
    slug: `test-${id.slice(0, 8)}`,
    country: "ES",
    source: "smoke",
    createdAt: new Date(now),
  })
  const rows = await db.select().from(leagues)
  console.log(`leagues count: ${rows.length}`)
  console.log(`first row: ${rows[0]?.name ?? "(empty)"}`)
  await db.delete(leagues)
  const after = await db.select().from(leagues)
  console.log(`after cleanup: ${after.length}`)
  closeDb()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
