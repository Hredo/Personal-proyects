import Database from "better-sqlite3"

const DB_PATH = process.env.DB_PATH ?? "data/basket.db"

const PctColumns = ["fg_pct", "three_pct", "ft_pct"] as const
const Sources = ["acb", "euroleague"] as const

const db = new Database(DB_PATH)

const placeholders = Sources.map(() => "?").join(",")

const stats = db
  .prepare(
    `
    SELECT
      p.source AS source,
      COUNT(*) AS rows,
      SUM(CASE WHEN ps.fg_pct < 0.5 THEN 1 ELSE 0 END) AS bad_fg,
      SUM(CASE WHEN ps.three_pct IS NOT NULL AND ps.three_pct < 0.5 THEN 1 ELSE 0 END) AS bad_3p,
      SUM(CASE WHEN ps.ft_pct IS NOT NULL AND ps.ft_pct < 0.5 THEN 1 ELSE 0 END) AS bad_ft
    FROM player_stats ps
    JOIN players p ON p.id = ps.player_id
    WHERE p.source IN (${placeholders})
    GROUP BY p.source
  `,
  )
  .all(...Sources)

console.log("Pre-backfill counts (values < 0.5):")
console.table(stats)

const runBackfill = db.transaction(() => {
  let updated = 0
  for (const col of PctColumns) {
    const res = db
      .prepare(
        `
        UPDATE player_stats
        SET ${col} = ROUND(${col} * 100, 3)
        WHERE player_id IN (
          SELECT id FROM players WHERE source IN (${placeholders})
        )
        AND ${col} IS NOT NULL
        AND ${col} < 0.5
      `,
      )
      .run(...Sources)
    updated += res.changes
    console.log(`  ${col}: updated ${res.changes} rows`)
  }
  return updated
})

const updated = runBackfill()

const after = db
  .prepare(
    `
    SELECT
      p.source AS source,
      MIN(ps.fg_pct) AS min_fg,
      MAX(ps.fg_pct) AS max_fg,
      ROUND(AVG(ps.fg_pct), 3) AS avg_fg
    FROM player_stats ps
    JOIN players p ON p.id = ps.player_id
    WHERE p.source IN (${placeholders})
    GROUP BY p.source
  `,
  )
  .all(...Sources)

console.log("Post-backfill ranges:")
console.table(after)
console.log(`Total updated: ${updated}`)

db.close()
