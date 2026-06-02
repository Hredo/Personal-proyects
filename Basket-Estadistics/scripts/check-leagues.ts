import { getDb, closeDb } from "../src/lib/db/client"
import { leagues } from "../src/lib/db/schema"

async function main() {
  const db = getDb()
  const rows = await db.select().from(leagues)
  console.log(JSON.stringify(rows, null, 2))
  closeDb()
}

main()
