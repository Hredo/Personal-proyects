/*
 * turnovers_total vanished from player_season_stats (present in yesterday's
 * audit + backup, gone now). Re-adds the column and restores values from
 * data/__backup-2026-06-11/player_season_stats.json keyed by row id.
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

type BackupRow = { id: string; turnovers_total: number | null }

async function main() {
  loadEnv()
  const backup = JSON.parse(
    readFileSync(
      resolve(process.cwd(), "data", "__backup-2026-06-11", "player_season_stats.json"),
      "utf8",
    ),
  ) as BackupRow[]
  const withValues = backup.filter((r) => r.turnovers_total != null)
  console.log(`[backup] ${backup.length} rows, ${withValues.length} with turnovers`)

  const sql = postgres(process.env.DATABASE_URL!, { prepare: false, connect_timeout: 20 })
  try {
    await sql`alter table player_season_stats add column if not exists turnovers_total integer`
    let restored = 0
    for (let i = 0; i < withValues.length; i += 500) {
      const chunk = withValues.slice(i, i + 500)
      const ids = chunk.map((r) => r.id)
      const values = chunk.map((r) => r.turnovers_total as number)
      const res = await sql`
        update player_season_stats p
        set turnovers_total = v.tov
        from (select unnest(${ids}::uuid[]) as id, unnest(${values}::int[]) as tov) v
        where p.id = v.id and p.turnovers_total is null
      `
      restored += res.count
    }
    console.log(`[restore] ${restored} rows restored`)
    const [check] = await sql`
      select count(*)::int as total,
        count(*) filter (where turnovers_total is not null)::int as with_tov
      from player_season_stats
    `
    console.log(`[verify] ${check.with_tov}/${check.total} rows have turnovers_total`)
  } finally {
    await sql.end()
  }
}

main().catch((e) => {
  console.error("RESTORE FAILED:", e?.message ?? e)
  process.exit(1)
})
