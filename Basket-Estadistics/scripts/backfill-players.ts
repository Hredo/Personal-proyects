import { eq, isNull, and, or, sql } from "drizzle-orm"
import { getDb, closeDb } from "@/lib/db/client"
import { players } from "@/lib/db/schema"

const BR_BASE = "https://www.basketball-reference.com"
const BR_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml",
  "Accept-Language": "en-US,en;q=0.9",
}

const NBA_BASE = "https://stats.nba.com/stats"
const NBA_HEADERS = {
  Referer: "https://www.nba.com/",
  Origin: "https://www.nba.com",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36",
}

const CONCURRENCY = 1
const DELAY_MS = 3500

async function fetchWithTimeout(url: string, headers: Record<string, string>, timeoutMs = 20000): Promise<string> {
  const ctl = new AbortController()
  const t = setTimeout(() => ctl.abort(), timeoutMs)
  try {
    const res = await fetch(url, { headers, signal: ctl.signal })
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
    return await res.text()
  } finally {
    clearTimeout(t)
  }
}

function parseHeightInchesToCm(s: string | undefined): number | undefined {
  if (!s) return undefined
  const m = s.match(/(\d+)-(\d+)/)
  if (!m) return undefined
  return Math.round((Number(m[1]) * 12 + Number(m[2])) * 2.54)
}

function parseLbToKg(s: string | undefined): number | undefined {
  if (!s) return undefined
  const m = s.match(/(\d+)\s*lb/)
  if (!m) return undefined
  return Math.round(Number(m[1]) * 0.453592)
}

function parseBirthdate(s: string | undefined): string | null {
  if (!s) return null
  const m = s.match(/(\d{4}-\d{2}-\d{2})/)
  return m ? m[1] : null
}

function parseEuroLeaguePlayerPage(html: string): { position?: string; heightCm?: number; weightKg?: number; birthdate?: string; nationality?: string } {
  const out: ReturnType<typeof parseEuroLeaguePlayerPage> = {}
  const blockMatch = html.match(/<strong>\s*Position:\s*<\/strong>([\s\S]{0,2500}?)<\/p>/i)
  if (blockMatch) {
    const block = blockMatch[1]
    const posMatch = block.match(/^\s*([A-Za-z\-\/,\s]+?)\s*(?=<|$)/)
    if (posMatch) out.position = posMatch[1].replace(/\s+/g, " ").trim()
    const inchMatch = block.match(/<span>\s*(\d+\-\d+)\s*<\/span>/)
    if (inchMatch) {
      const cm = parseHeightInchesToCm(inchMatch[1])
      if (cm) out.heightCm = cm
    }
    const lbMatch = block.match(/<span>\s*(\d+)\s*lb\s*<\/span>/i)
    if (lbMatch) {
      const kg = parseLbToKg(`${lbMatch[1]}lb`)
      if (kg) out.weightKg = kg
    }
  }
  const bMatch = html.match(/data-birth="([^"]+)"/)
  if (bMatch) out.birthdate = parseBirthdate(bMatch[1]) ?? undefined
  const natMatch = html.match(/<strong>\s*Born:\s*<\/strong>[\s\S]{0,2000}?in\s+([A-Za-z\s,\-]+?)\s*<\/span>/i)
  if (natMatch) {
    const place = natMatch[1]
    const parts = place.split(",").map((p) => p.trim())
    out.nationality = parts[parts.length - 1] || place
  }
  return out
}

async function backfillEuroLeaguePlayers(): Promise<{ updated: number; total: number }> {
  const db = getDb()
  const all = await db
    .select()
    .from(players)
    .where(
      and(
        eq(players.source, "euroleague"),
        or(
          isNull(players.position),
          isNull(players.heightCm),
          isNull(players.weightKg),
          isNull(players.birthdate),
          isNull(players.nationality),
        ),
      ),
    )
  console.log(`[euroleague] ${all.length} players to backfill`)
  let updated = 0
  let i = 0
  const queue = [...all]
  async function worker(): Promise<void> {
    while (queue.length) {
      const p = queue.shift()!
      i++
      let attempt = 0
      const maxAttempts = 4
      while (attempt < maxAttempts) {
        attempt++
        try {
          const url = `${BR_BASE}/international/players/${p.sourceId}.html`
          const html = await fetchWithTimeout(url, BR_HEADERS)
          const parsed = parseEuroLeaguePlayerPage(html)
          const fillIns: Partial<typeof players.$inferInsert> = {}
          if (parsed.position && !p.position) fillIns.position = parsed.position
          if (parsed.heightCm && !p.heightCm) fillIns.heightCm = parsed.heightCm
          if (parsed.weightKg && !p.weightKg) fillIns.weightKg = parsed.weightKg
          if (parsed.birthdate && !p.birthdate) fillIns.birthdate = parsed.birthdate
          if (parsed.nationality && !p.nationality) fillIns.nationality = parsed.nationality
          if (Object.keys(fillIns).length > 0) {
            await db.update(players).set(fillIns).where(eq(players.id, p.id))
            updated++
            console.log(`  [${i}/${all.length}] ${p.fullName}: ${Object.keys(fillIns).join(",")}`)
          }
          break
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err)
          if (msg.includes("429") && attempt < maxAttempts) {
            const backoff = DELAY_MS * attempt * 2
            await new Promise((r) => setTimeout(r, backoff))
            continue
          }
          console.warn(`  [${i}/${all.length}] ${p.fullName}: FAILED ${msg}`)
          break
        }
      }
      await new Promise((r) => setTimeout(r, DELAY_MS))
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()))
  return { updated, total: all.length }
}

type NbaEnv = {
  resultSets: { name: string; headers: string[]; rowSet: (string | number | null)[][] }[]
}

async function fetchNbaPlayerInfo(playerId: string): Promise<{ position?: string; birthdate?: string }> {
  const url = `${NBA_BASE}/commonplayerinfo?LeagueID=00&PlayerID=${playerId}`
  for (let attempt = 1; attempt <= 4; attempt++) {
    const res = await fetch(url, { headers: NBA_HEADERS })
    if (res.ok) {
      const json = (await res.json()) as NbaEnv
      const set = json.resultSets.find((rs) => rs.name === "CommonPlayerInfo")
      if (!set) return {}
      const row = set.rowSet[0]
      if (!row) return {}
      const obj: Record<string, string | number | null> = {}
      for (let i = 0; i < set.headers.length; i++) obj[set.headers[i]] = row[i] ?? null
      return {
        position: obj.POSITION ? String(obj.POSITION) : undefined,
        birthdate: obj.BIRTHDATE ? String(obj.BIRTHDATE).substring(0, 10) : undefined,
      }
    }
    if (res.status === 429 || res.status >= 500) {
      const backoff = 1500 * attempt
      await new Promise((r) => setTimeout(r, backoff))
      continue
    }
    throw new Error(`${res.status}`)
  }
  throw new Error("429 after retries")
}

async function backfillNbaPlayers(): Promise<{ updated: number; total: number }> {
  const db = getDb()
  const all = await db
    .select()
    .from(players)
    .where(and(eq(players.source, "nba"), isNull(players.position)))
  console.log(`[nba] ${all.length} players to backfill`)
  let updated = 0
  let i = 0
  const queue = [...all]
  async function worker(): Promise<void> {
    while (queue.length) {
      const p = queue.shift()!
      i++
      try {
        const info = await fetchNbaPlayerInfo(p.sourceId)
        const fillIns: Partial<typeof players.$inferInsert> = {}
        if (info.position) fillIns.position = info.position
        if (info.birthdate) fillIns.birthdate = info.birthdate
        if (Object.keys(fillIns).length > 0) {
          await db.update(players).set(fillIns).where(eq(players.id, p.id))
          updated++
          console.log(`  [${i}/${all.length}] ${p.fullName}: ${Object.keys(fillIns).join(",")}`)
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        console.warn(`  [${i}/${all.length}] ${p.fullName}: FAILED ${msg}`)
      }
      await new Promise((r) => setTimeout(r, 50))
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()))
  return { updated, total: all.length }
}

async function main() {
  const only = process.argv[2]
  if (!only || only === "euroleague" || only === "all") {
    const el = await backfillEuroLeaguePlayers()
    console.log(`[euroleague] done: ${el.updated}/${el.total} updated`)
  }
  if (!only || only === "nba" || only === "all") {
    const nb = await backfillNbaPlayers()
    console.log(`[nba] done: ${nb.updated}/${nb.total} updated`)
  }
  closeDb()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
