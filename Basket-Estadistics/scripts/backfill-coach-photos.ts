/*
 * Coach photos + missing ages via the Wikipedia REST summary endpoint.
 * League-agnostic, fills null columns only.
 * Usage: pnpm exec tsx scripts/backfill-coach-photos.ts <league-slug> [--dry]
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

const LEAGUE = process.argv[2]
const DRY = process.argv.includes("--dry")
const UA = "globalhoopstats-backfill/1.0 (local dev tool)"

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

type WikiSummary = {
  type?: string
  description?: string
  thumbnail?: { source?: string }
  originalimage?: { source?: string }
}

const BASKET_HINT = /basket|coach|entrenador|baloncesto/i

async function wikiSummary(title: string): Promise<WikiSummary | null> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
        {
          headers: { "User-Agent": UA, Accept: "application/json" },
          signal: AbortSignal.timeout(20_000),
        },
      )
      if (res.status === 429) {
        await sleep(20_000 * attempt)
        continue
      }
      if (!res.ok) return null
      return (await res.json()) as WikiSummary
    } catch {
      await sleep(3000)
    }
  }
  return null
}

async function photoFor(name: string): Promise<string | null> {
  const summary = await wikiSummary(name)
  if (!summary || summary.type === "disambiguation") return null
  // Only trust the image when the page is plausibly about a basketball figure.
  if (!BASKET_HINT.test(summary.description ?? "")) return null
  return summary.thumbnail?.source ?? summary.originalimage?.source ?? null
}

async function main() {
  if (!LEAGUE) {
    console.error("usage: tsx scripts/backfill-coach-photos.ts <league-slug> [--dry]")
    process.exit(1)
  }
  loadEnv()
  const sql = postgres(process.env.DATABASE_URL!, { prepare: false, connect_timeout: 20 })
  try {
    const rows = await sql<{ id: string; full_name: string; role: string }[]>`
      select c.id, c.full_name, c.role
      from coaches c
      join leagues l on l.id = c.league_id
      where l.slug = ${LEAGUE} and c.photo_url is null
      order by case when c.role = 'head_coach' then 0 else 1 end, c.full_name
    `
    console.log(`[${LEAGUE}] ${rows.length} coaches without photo`)
    let updated = 0
    for (const c of rows) {
      const photo = await photoFor(c.full_name)
      await sleep(900)
      if (!photo) {
        console.log(`  ${c.full_name} (${c.role}): no wiki photo`)
        continue
      }
      if (DRY) {
        console.log(`  [dry] ${c.full_name}: ${photo.slice(0, 80)}`)
        continue
      }
      await sql`update coaches set photo_url = ${photo} where id = ${c.id}`
      updated++
      console.log(`  ${c.full_name}: photo`)
    }
    console.log(`[${LEAGUE}] photos updated=${updated}`)
  } finally {
    await sql.end()
  }
}

main().catch((e) => {
  console.error("BACKFILL FAILED:", e?.message ?? e)
  process.exit(1)
})
