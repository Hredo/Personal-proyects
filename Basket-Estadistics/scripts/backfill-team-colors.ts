import { closeDb, getDb } from "@/lib/db/client"
import { leagues } from "@/lib/db/schema"

async function main() {
  const db = getDb()
  const leagueRows = await db
    .select({ id: leagues.id, slug: leagues.slug })
    .from(leagues)

  for (const lg of leagueRows) {
    console.log(`[${lg.slug}] no color map available — schema no longer supports team colors`)
  }

  closeDb()
}

main().catch((err) => {
  console.error(err)
  closeDb()
  process.exit(1)
})
