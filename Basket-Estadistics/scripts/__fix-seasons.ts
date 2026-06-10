import { readFileSync } from "node:fs"
import { resolve } from "node:path"

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
        const value = trimmed
          .slice(eqIdx + 1)
          .trim()
          .replace(/^(["'])(.*)\1$/, "$2")
        if (!process.env[key]) process.env[key] = value
      }
    } catch {
      // file not found, skip
    }
  }
}
loadEnv()

const CURRENT_SEASON_NAMES = ["2025-26", "E2025"]

async function main() {
  const { getDb, closeDb } = await import("@/lib/db/client")
  const { sql } = await import("drizzle-orm")
  const db = getDb()

  const rows = (await db.execute(
    sql.raw(`
      SELECT s.id, s.name,
        (SELECT count(*)::int FROM player_season_stats p WHERE p.season_id = s.id) AS stats
      FROM seasons s
      ORDER BY s.name, stats DESC, s.id
    `),
  )) as unknown as { id: string; name: string; stats: number }[]

  const byName = new Map<string, { id: string; stats: number }[]>()
  for (const r of rows) {
    const list = byName.get(r.name) ?? []
    list.push({ id: r.id, stats: r.stats })
    byName.set(r.name, list)
  }

  await db.transaction(async (tx) => {
    for (const [name, list] of byName) {
      if (list.length < 2) continue
      const keeper = list[0]
      const dups = list.slice(1)
      console.log(
        `[seasons] "${name}": keeping ${keeper.id} (${keeper.stats} stats), merging ${dups.length} duplicate(s)`,
      )
      for (const dup of dups) {
        await tx.execute(
          sql.raw(`
            DELETE FROM player_season_stats a
            USING player_season_stats b
            WHERE a.season_id = '${dup.id}' AND b.season_id = '${keeper.id}'
              AND a.player_id = b.player_id AND a.team_id = b.team_id
              AND a.league_id = b.league_id
          `),
        )
        await tx.execute(
          sql.raw(`
            UPDATE player_season_stats SET season_id = '${keeper.id}'
            WHERE season_id = '${dup.id}'
          `),
        )
        await tx.execute(
          sql.raw(`
            DELETE FROM team_season_stats a
            USING team_season_stats b
            WHERE a.season_id = '${dup.id}' AND b.season_id = '${keeper.id}'
              AND a.team_id = b.team_id AND a.league_id = b.league_id
          `),
        )
        await tx.execute(
          sql.raw(`
            UPDATE team_season_stats SET season_id = '${keeper.id}'
            WHERE season_id = '${dup.id}'
          `),
        )
        await tx.execute(sql.raw(`DELETE FROM seasons WHERE id = '${dup.id}'`))
        console.log(
          `[seasons]   merged ${dup.id} (${dup.stats} stats) → keeper`,
        )
      }
    }

    const names = CURRENT_SEASON_NAMES.map((n) => `'${n}'`).join(",")
    await tx.execute(
      sql.raw(`UPDATE seasons SET is_current = (name IN (${names}))`),
    )
    console.log(
      `[seasons] is_current set for: ${CURRENT_SEASON_NAMES.join(", ")}`,
    )
  })

  const after = (await db.execute(
    sql.raw(`
      SELECT s.name, s.is_current,
        (SELECT count(*)::int FROM player_season_stats p WHERE p.season_id = s.id) AS stats
      FROM seasons s ORDER BY s.name
    `),
  )) as unknown as { name: string; is_current: boolean; stats: number }[]
  console.log("\n[seasons] final state:")
  for (const s of after)
    console.log(
      `  ${s.name.padEnd(10)} current=${s.is_current} stats=${s.stats}`,
    )

  closeDb()
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
