/*
 * ACB player bio backfill. The acb.com roster exposes height/position/
 * nationality/photo but NOT weight, so weight_kg is null for most ACB players.
 * Basketball-Reference's Liga ACB pages link to international player pages that
 * carry weight (and height/position/nationality), so we map ACB roster players
 * to those pages by name — the same join the ACB stats adapter already uses.
 *
 * Fills null columns only. Usage:
 *   pnpm exec tsx scripts/backfill-acb-bio.ts [--dry] [--limit N]
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
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1)
    }
    process.env[m[1]] = v
  }
}

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36"
const BR_DELAY_MS = 3500
const BR_YEAR = "2026" // 2025-26 season on basketball-reference

const ARGS = new Set(process.argv.slice(2))
const DRY = ARGS.has("--dry")
const LIMIT = (() => {
  const i = process.argv.indexOf("--limit")
  return i >= 0 ? Number(process.argv[i + 1]) : Infinity
})()

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

function norm(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

async function fetchText(url: string, timeoutMs = 90_000): Promise<string> {
  let lastErr: unknown
  for (let attempt = 1; attempt <= 4; attempt++) {
    let res: Response
    try {
      res = await fetch(url, {
        headers: {
          "User-Agent": UA,
          Accept: "text/html,application/xhtml+xml",
          "Accept-Language": "en-US,en;q=0.9",
        },
        signal: AbortSignal.timeout(timeoutMs),
      })
    } catch (err) {
      lastErr = err
      await sleep(BR_DELAY_MS * attempt)
      continue
    }
    if (res.ok) return res.text()
    if (res.status === 429 || res.status >= 500) {
      lastErr = new Error(`${res.status} ${res.statusText}`)
      await sleep(BR_DELAY_MS * attempt * 2)
      continue
    }
    throw new Error(`${res.status} ${res.statusText}`)
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr))
}

function parseHeightInchesToCm(s: string | undefined): number | undefined {
  if (!s) return undefined
  const m = s.match(/(\d+)-(\d+)/)
  if (!m) return undefined
  return Math.round((Number(m[1]) * 12 + Number(m[2])) * 2.54)
}

function parseBrPlayerPage(rawHtml: string): {
  position?: string
  heightCm?: number
  weightKg?: number
  nationality?: string
} {
  const out: ReturnType<typeof parseBrPlayerPage> = {}
  // BR's meta block separates values with &nbsp; (e.g. "(216cm,&nbsp;120kg)").
  // Collapse those to plain spaces so the cm/kg/lb patterns can match.
  const html = rawHtml.replace(/&nbsp;|&#160;| /g, " ")
  const posMatch = html.match(
    /<strong>\s*Position:\s*<\/strong>\s*([A-Za-z\-/,\s]+?)\s*(?:<|▪|$)/i,
  )
  if (posMatch) out.position = posMatch[1].replace(/\s+/g, " ").trim()
  const metricMatch = html.match(/\((\d{3})cm,\s*(\d{2,3})kg\)/)
  if (metricMatch) {
    out.heightCm = Number(metricMatch[1])
    out.weightKg = Number(metricMatch[2])
  } else {
    const imperial = html.match(/(\d-\d{1,2}),\s*(\d{2,3})lb/)
    if (imperial) {
      out.heightCm = parseHeightInchesToCm(imperial[1])
      out.weightKg = Math.round(Number(imperial[2]) * 0.453592)
    }
  }
  const natMatch = html.match(
    /<strong>\s*Born:\s*<\/strong>[\s\S]{0,2000}?\bin\s+([A-Za-z\s,'-]+?)\s*<\/(?:span|p)>/i,
  )
  if (natMatch) {
    const parts = natMatch[1].split(",").map((p) => p.trim())
    out.nationality = parts[parts.length - 1] || undefined
  }
  return out
}

function extractTableById(html: string, id: string): string {
  const re = new RegExp(`<table[^>]*\\bid="${id}"[\\s\\S]*?<\\/table>`, "i")
  const m = html.match(re)
  return m ? m[0] : ""
}

type DbPlayer = {
  id: string
  name: string
  position: string | null
  height_cm: number | null
  weight_kg: number | null
  nationality: string | null
  image_url: string | null
}

async function main() {
  loadEnv()
  const sql = postgres(process.env.DATABASE_URL!, {
    prepare: false,
    connect_timeout: 20,
  })
  try {
    /* ---- ACB players with any null bio field (current season) ---- */
    const targets = await sql<DbPlayer[]>`
      select distinct p.id, p.first_name || ' ' || p.last_name as name,
        p.position, p.height_cm, p.weight_kg, p.nationality, p.image_url
      from players p
      join player_season_stats pss on pss.player_id = p.id
      join leagues l on l.id = pss.league_id
      join seasons s on s.id = pss.season_id
      where l.slug = 'acb' and s.is_current
        and (p.position is null or p.height_cm is null
          or p.weight_kg is null or p.nationality is null)
    `
    console.log(`[acb] ${targets.length} players with at least one null bio field`)
    // BR has no headshots, so an image-only gap can't be filled here.
    const crawl = targets.filter(
      (p) => !p.position || !p.height_cm || !p.weight_kg || !p.nationality,
    )

    /* ---- Index BR Liga ACB per_game player links by normalized name ---- */
    const perGameHtml = await fetchText(
      `https://www.basketball-reference.com/international/spain-liga-acb/${BR_YEAR}_per_game.html`,
    )
    const tableHtml =
      extractTableById(perGameHtml, `per_game-stats-${BR_YEAR}`) || perGameHtml
    const nameToPath = new Map<string, string>()
    const dupNames = new Set<string>()
    const linkRe =
      /<a[^>]*href=(?:"|')(\/international\/players\/[^"']+\.html)(?:"|')[^>]*>([^<]+)<\/a>/g
    let lm: RegExpExecArray | null
    while ((lm = linkRe.exec(tableHtml)) !== null) {
      const key = norm(lm[2])
      if (!key) continue
      const prior = nameToPath.get(key)
      if (prior && prior !== lm[1]) dupNames.add(key)
      else nameToPath.set(key, lm[1])
    }
    console.log(`[acb] ${nameToPath.size} BR player links indexed`)

    let updated = 0
    let fetched = 0
    let missed = 0
    const missedNames: string[] = []
    for (const p of crawl) {
      if (fetched >= LIMIT) break
      const key = norm(p.name)
      if (dupNames.has(key)) {
        missed++
        missedNames.push(`${p.name} (ambiguous)`)
        continue
      }
      const path = nameToPath.get(key)
      if (!path) {
        missed++
        missedNames.push(p.name)
        continue
      }
      try {
        const html = await fetchText(
          `https://www.basketball-reference.com${path}`,
        )
        fetched++
        const parsed = parseBrPlayerPage(html)
        const fills: Record<string, string | number> = {}
        if (!p.position && parsed.position) fills.position = parsed.position
        if (!p.height_cm && parsed.heightCm) fills.height_cm = parsed.heightCm
        if (!p.weight_kg && parsed.weightKg) fills.weight_kg = parsed.weightKg
        if (!p.nationality && parsed.nationality)
          fills.nationality = parsed.nationality
        if (Object.keys(fills).length === 0) {
          console.log(`  [${fetched}] ${p.name}: BR page had nothing new`)
        } else if (DRY) {
          console.log(`  [dry][${fetched}] ${p.name}: ${Object.keys(fills).join(",")}`)
        } else {
          await sql`update players set ${sql(fills)} where id = ${p.id}`
          updated++
          console.log(`  [${fetched}] ${p.name}: ${Object.keys(fills).join(",")}`)
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        console.warn(`  [${fetched}] ${p.name}: FAILED ${msg}`)
      }
      await sleep(BR_DELAY_MS)
    }
    console.log(
      `[acb] updated=${updated} fetched=${fetched} unmatched=${missed} (of ${crawl.length} to crawl)`,
    )
    if (missedNames.length > 0) {
      console.log(`[acb] unmatched players:\n  - ${missedNames.join("\n  - ")}`)
    }
  } finally {
    await sql.end()
  }
}

main().catch((e) => {
  console.error("ACB BACKFILL FAILED:", e?.message ?? e)
  process.exit(1)
})
