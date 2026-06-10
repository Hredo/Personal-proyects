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

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36"
const BR_DELAY_MS = 3500

function norm(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

async function fetchText(url: string, accept: string): Promise<string> {
  let lastErr: unknown
  for (let attempt = 1; attempt <= 4; attempt++) {
    let res: Response
    try {
      res = await fetch(url, {
        headers: { "User-Agent": UA, Accept: accept },
        signal: AbortSignal.timeout(90_000),
      })
    } catch (err) {
      // timeouts / transient network errors — retry with backoff
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

function parseBrPlayerPage(html: string): {
  position?: string
  heightCm?: number
  weightKg?: number
  nationality?: string
} {
  const out: ReturnType<typeof parseBrPlayerPage> = {}
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
  const { getDb, closeDb } = await import("@/lib/db/client")
  const { sql, eq } = await import("drizzle-orm")
  const { players } = await import("@/lib/db/schema")
  const db = getDb()

  const incompleteByLeague = async (slug: string) =>
    (await db.execute(
      sql.raw(`
        SELECT DISTINCT p.id, p.first_name || ' ' || p.last_name AS name,
               p.position, p.height_cm, p.weight_kg, p.nationality, p.image_url
        FROM players p
        JOIN player_season_stats s ON s.player_id = p.id
        JOIN leagues l ON l.id = s.league_id
        WHERE l.slug = '${slug}'
          AND (p.position IS NULL OR p.height_cm IS NULL
            OR p.weight_kg IS NULL OR p.nationality IS NULL
            OR p.image_url IS NULL)
      `),
    )) as unknown as DbPlayer[]

  /* ---- Part 1: EuroLeague via basketball-reference player pages ---- */
  console.log("\n── EuroLeague backfill (BR player pages) ──")
  const elTargets = await incompleteByLeague("euroleague")
  // image_url has no BR source; only crawl players missing bio fields.
  const elCrawl = elTargets.filter(
    (p) => !p.position || !p.height_cm || !p.weight_kg || !p.nationality,
  )
  console.log(
    `[euroleague] ${elCrawl.length} players need BR pages (of ${elTargets.length} incomplete)`,
  )
  if (elCrawl.length > 0) {
    const totalsHtml = await fetchText(
      "https://www.basketball-reference.com/international/euroleague/2025_totals.html",
      "text/html",
    )
    const nameToPath = new Map<string, string>()
    const dupNames = new Set<string>()
    const linkRe =
      /<a[^>]*href=(?:"|')(\/international\/players\/[^"']+\.html)(?:"|')[^>]*>([^<]+)<\/a>/g
    let lm: RegExpExecArray | null
    while ((lm = linkRe.exec(totalsHtml)) !== null) {
      const key = norm(lm[2])
      if (!key) continue
      const prior = nameToPath.get(key)
      if (prior && prior !== lm[1]) dupNames.add(key)
      else nameToPath.set(key, lm[1])
    }
    console.log(`[euroleague] ${nameToPath.size} BR player links indexed`)

    let updated = 0
    let fetched = 0
    for (const p of elCrawl) {
      const key = norm(p.name)
      if (dupNames.has(key)) continue
      const path = nameToPath.get(key)
      if (!path) continue
      try {
        const html = await fetchText(
          `https://www.basketball-reference.com${path}`,
          "text/html",
        )
        fetched++
        const parsed = parseBrPlayerPage(html)
        const fills: Record<string, unknown> = {}
        if (!p.position && parsed.position) fills.position = parsed.position
        if (!p.height_cm && parsed.heightCm) fills.heightCm = parsed.heightCm
        if (!p.weight_kg && parsed.weightKg) fills.weightKg = parsed.weightKg
        if (!p.nationality && parsed.nationality)
          fills.nationality = parsed.nationality
        if (Object.keys(fills).length > 0) {
          await db.update(players).set(fills).where(eq(players.id, p.id))
          updated++
          console.log(
            `  [${fetched}/${elCrawl.length}] ${p.name}: ${Object.keys(fills).join(",")}`,
          )
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        console.warn(`  [${fetched}/${elCrawl.length}] ${p.name}: FAILED ${msg}`)
      }
      await sleep(BR_DELAY_MS)
    }
    console.log(`[euroleague] updated ${updated} players (${fetched} pages)`)
  }

  closeDb()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
