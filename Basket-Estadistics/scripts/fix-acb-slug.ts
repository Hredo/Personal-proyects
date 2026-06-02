import { eq } from "drizzle-orm"
import { getDb, closeDb } from "../src/lib/db/client"
import { leagues } from "../src/lib/db/schema"

async function main() {
  const db = getDb()
  const updated = await db
    .update(leagues)
    .set({ slug: "acb" })
    .where(eq(leagues.source, "acb"))
    .returning()
  console.log("Updated:", updated)
  closeDb()
}

main()
