import { SOURCES, SOURCE_IDS, type SourceId } from "@/lib/sources"
import { runSync, shutdown, summarizeDb, type SyncResult } from "@/lib/sync/run"
import { revalidateCacheTags } from "@/lib/sync/revalidate"

function parseTargets(argv: string[]): SourceId[] {
  const args = argv.slice(2).filter((a) => !a.startsWith("--"))
  if (args.length === 0) return SOURCE_IDS
  const valid = SOURCE_IDS
  return args
    .map((a) => a.toLowerCase())
    .filter((a): a is SourceId => (valid as string[]).includes(a))
}

function formatResult(r: SyncResult): string {
  if (r.status === "failed") {
    return `[${r.source}] FAILED in ${r.durationMs}ms — ${r.error}`
  }
  return (
    `[${r.source}] OK in ${r.durationMs}ms — ` +
    `teams: ${r.totals.teams}, players: ${r.totals.players}, stats: ${r.totals.stats}, ` +
    `coaches: ${r.totals.coaches}, team_stats: ${r.totals.teamStats}`
  )
}

async function main() {
  const targets = parseTargets(process.argv)
  console.log(
    `→ syncing ${targets.join(", ")} (season ${SOURCES[targets[0]!].season})`,
  )

  const results: SyncResult[] = []
  for (const id of targets) {
    try {
      const r = await runSync(SOURCES[id])
      results.push(r)
      console.log(formatResult(r))
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`[${id}] uncaught: ${message}`)
      results.push({
        source: id,
        status: "failed",
        durationMs: 0,
        rowsWritten: 0,
        error: message,
        totals: { teams: 0, players: 0, stats: 0, coaches: 0, teamStats: 0 },
      })
    }
  }

  const summary = await summarizeDb()
  console.log(
    `\nDB totals → leagues: ${summary.leagues}, teams: ${summary.teams}, ` +
      `players: ${summary.players}, stats rows: ${summary.stats}, ` +
      `coaches: ${summary.coaches}, team_stats: ${summary.teamStats}`,
  )

  await revalidateCacheTags()

  shutdown()
  const failed = results.filter((r) => r.status === "failed")
  if (failed.length > 0 && failed.length === results.length) {
    process.exit(1)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
