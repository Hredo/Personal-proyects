import { eq, isNull, and } from "drizzle-orm"
import { closeDb, getDb } from "@/lib/db/client"
import { leagues, teams } from "@/lib/db/schema"
import { TEAM_COLORS_BY_SOURCE } from "@/lib/theme/team-colors"

async function main() {
  const db = getDb()
  const leagueRows = await db
    .select({ id: leagues.id, slug: leagues.slug })
    .from(leagues)

  const totals: Record<string, { updated: number; skipped: number }> = {
    nba: { updated: 0, skipped: 0 },
    euroleague: { updated: 0, skipped: 0 },
    acb: { updated: 0, skipped: 0 },
  }

  for (const lg of leagueRows) {
    const map = TEAM_COLORS_BY_SOURCE[lg.slug]
    if (!map) {
      const missing = await db
        .select({ id: teams.id, sourceId: teams.sourceId, name: teams.name })
        .from(teams)
        .where(and(eq(teams.leagueId, lg.id), isNull(teams.primaryColor)))
      console.log(
        `[${lg.slug}] no color map registered — ${missing.length} teams left without primaryColor`,
      )
      continue
    }

    const pending = await db
      .select({ id: teams.id, sourceId: teams.sourceId, name: teams.name })
      .from(teams)
      .where(and(eq(teams.leagueId, lg.id), isNull(teams.primaryColor)))

    for (const t of pending) {
      const hex = map[t.sourceId]
      if (!hex) {
        totals[lg.slug]!.skipped++
        continue
      }
      await db
        .update(teams)
        .set({ primaryColor: hex })
        .where(eq(teams.id, t.id))
      totals[lg.slug]!.updated++
    }
  }

  console.log("\nBackfill summary:")
  for (const [slug, t] of Object.entries(totals)) {
    console.log(
      `  ${slug.padEnd(11)} updated=${t.updated} skipped=${t.skipped}`,
    )
  }
  console.log(
    `\nDone. Run \`pnpm sync:acb\` to refresh ACB colors from the source, ` +
      `or rerun this script after adding new entries to src/lib/theme/team-colors.ts.`,
  )
  closeDb()
}

main().catch((err) => {
  console.error(err)
  closeDb()
  process.exit(1)
})
