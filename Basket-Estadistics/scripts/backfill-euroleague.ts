import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"
import { and, eq, isNull, or, sql } from "drizzle-orm"
import { closeDb, getDb } from "@/lib/db/client"
import { coaches, leagues, players, teams } from "@/lib/db/schema"
import {
  EUROLEAGUE_COACHES_2024_25,
  EUROLEAGUE_TEAM_META,
} from "@/lib/sources/euroleague-static"
import { TEAM_COLORS_BY_SOURCE } from "@/lib/theme/team-colors"
import { slugify } from "@/lib/sync/slug"

const CACHE_PATH = resolve(process.cwd(), "data", "wikipedia-cache.json")

type WikiCache = Record<string, WikiBio | null>

type WikiBio = {
  title: string
  pageId: number
  image: string | null
  extract: string
  parsed: {
    birthdate?: string
    nationality?: string
    position?: string
    heightCm?: number
    weightKg?: number
  }
}

function loadCache(): WikiCache {
  if (existsSync(CACHE_PATH)) {
    try {
      return JSON.parse(readFileSync(CACHE_PATH, "utf-8")) as WikiCache
    } catch {
      return {}
    }
  }
  return {}
}

function saveCache(cache: WikiCache) {
  writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2), "utf-8")
}

const WIKI_HEADERS = {
  "User-Agent":
    "BasketEstadistics/1.0 (basketball statistics aggregator; contact via repo)",
  Accept: "application/json",
}

const WIKI_DELAY_MS = 1200
let lastRequestAt = 0

async function rateLimit() {
  const now = Date.now()
  const wait = WIKI_DELAY_MS - (now - lastRequestAt)
  if (wait > 0) await delay(wait)
  lastRequestAt = Date.now()
}

async function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

async function fetchJson(url: string): Promise<unknown> {
  await rateLimit()
  const res = await fetch(url, { headers: WIKI_HEADERS })
  if (res.status === 429) {
    throw new Error("RATE_LIMITED")
  }
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText}`)
  }
  return await res.json()
}

const POSITION_MAP: Record<string, string> = {
  "point guard": "PG",
  "shooting guard": "SG",
  "small forward": "SF",
  "power forward": "PF",
  center: "C",
  guard: "G",
  forward: "F",
  "guard/forward": "G-F",
  "forward/guard": "F-G",
  "forward-center": "F-C",
  "center-forward": "C-F",
}

function parsePosition(text: string): string | undefined {
  const lower = text.toLowerCase()
  for (const [key, val] of Object.entries(POSITION_MAP)) {
    if (lower.includes(`plays the ${key}`) || lower.includes(`${key} position`)) {
      return val
    }
  }
  if (/\b(pg|sg|sf|pf|c\b)\b/i.test(lower)) {
    const m = lower.match(/\b(pg|sg|sf|pf|c)\b/)
    if (m) return m[1].toUpperCase()
  }
  return undefined
}

function parseHeightCm(text: string): number | undefined {
  const ftIn = text.match(/(\d+)\s*(?:ft|feet|′|')\s*(\d+)?\s*(?:in|inches|″|")?/i)
  if (ftIn) {
    const feet = Number(ftIn[1])
    const inches = Number(ftIn[2] ?? 0)
    return Math.round(feet * 30.48 + inches * 2.54)
  }
  const m = text.match(/(\d+(?:\.\d+)?)\s*m\b/i)
  if (m) return Math.round(Number(m[1]) * 100)
  const cm = text.match(/(\d{2,3})\s*cm/i)
  if (cm) return Number(cm[1])
  return undefined
}

function parseWeightKg(text: string): number | undefined {
  const lb = text.match(/(\d{2,3})\s*(?:lb|lbs|pound)/i)
  if (lb) return Math.round(Number(lb[1]) * 0.453592)
  const kg = text.match(/(\d{2,3})\s*(?:kg|kilogram)/i)
  if (kg) return Number(kg[1])
  return undefined
}

function parseBirthdate(text: string): string | undefined {
  const monthMap: Record<string, string> = {
    january: "01", february: "02", march: "03", april: "04", may: "05", june: "06",
    july: "07", august: "08", september: "09", october: "10", november: "11", december: "12",
  }
  const monthShort: Record<string, string> = {
    jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
    jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
  }
  const named = text.match(/(\d{1,2})\s+([A-Z][a-z]+)\s+(\d{4})/)
  if (named) {
    const day = named[1].padStart(2, "0")
    const mon = monthMap[named[2].toLowerCase()] ?? monthShort[named[2].toLowerCase().slice(0, 3)]
    if (mon) return `${named[3]}-${mon}-${day}`
  }
  const namedUS = text.match(/([A-Z][a-z]+)\s+(\d{1,2}),?\s+(\d{4})/)
  if (namedUS) {
    const mon = monthMap[namedUS[1].toLowerCase()] ?? monthShort[namedUS[1].toLowerCase().slice(0, 3)]
    const day = namedUS[2].padStart(2, "0")
    if (mon) return `${namedUS[3]}-${mon}-${day}`
  }
  const iso = text.match(/(\d{4})-(\d{2})-(\d{2})/)
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`
  return undefined
}

function parseNationality(text: string): string | undefined {
  const m = text.match(/\b(is an?|was an?)\s+([A-Z][a-z]+(?:[\s-][A-Z][a-z]+)*)\s+(?:professional|amateur|basketball|football)/)
  if (m) {
    const candidate = m[2]
    if (candidate.length < 25) return candidate
  }
  const flags = [
    "American", "Argentine", "Australian", "Austrian", "Belgian", "Brazilian",
    "British", "Bulgarian", "Canadian", "Chilean", "Chinese", "Colombian",
    "Croatian", "Cuban", "Czech", "Danish", "Dominican", "Dutch", "Egyptian",
    "English", "Estonian", "Filipino", "Finnish", "French", "Georgian",
    "German", "Greek", "Hungarian", "Icelandic", "Indian", "Indonesian",
    "Iranian", "Iraqi", "Irish", "Israeli", "Italian", "Jamaican", "Japanese",
    "Kazakh", "Kenyan", "Korean", "Latvian", "Lebanese", "Lithuanian",
    "Macedonian", "Malaysian", "Mexican", "Mongolian", "Montenegrin", "Moroccan",
    "New Zealander", "Nigerian", "Norwegian", "Pakistani", "Panamanian", "Peruvian",
    "Polish", "Portuguese", "Puerto Rican", "Romanian", "Russian", "Saudi",
    "Scottish", "Senegalese", "Serbian", "Slovak", "Slovenian", "South African",
    "Spanish", "Swedish", "Swiss", "Thai", "Tunisian", "Turkish", "Ukrainian",
    "Uruguayan", "Uzbek", "Venezuelan", "Vietnamese", "Welsh",
  ]
  for (const f of flags) {
    const re = new RegExp(`\\b${f}\\b`, "i")
    if (re.test(text)) return f
  }
  return undefined
}

function parseBioFromExtract(extract: string): WikiBio["parsed"] {
  const firstPara = extract.split(/\n+/)[0] ?? extract
  return {
    birthdate: parseBirthdate(firstPara),
    nationality: parseNationality(firstPara),
    position: parsePosition(firstPara),
    heightCm: parseHeightCm(firstPara),
    weightKg: parseWeightKg(firstPara),
  }
}

async function searchWikipedia(
  fullName: string,
  cache: WikiCache,
): Promise<WikiBio | null> {
  if (fullName in cache) return cache[fullName]!

  const variants = [fullName, `${fullName} (basketball)`]
  for (const query of variants) {
    const url =
      `https://en.wikipedia.org/w/api.php?action=query&format=json` +
      `&prop=extracts|pageimages&exintro&explaintext&piprop=original&redirects=1` +
      `&titles=${encodeURIComponent(query)}`
    try {
      const data = (await fetchJson(url)) as {
        query?: { pages?: Record<string, { pageid?: number; title?: string; extract?: string; original?: { source?: string }; missing?: string }> }
      }
      const pages = data.query?.pages ?? {}
      const page = Object.values(pages)[0]
      if (!page || page.missing !== undefined || !page.extract) continue
      if (page.extract.length < 60) continue
      const bio: WikiBio = {
        title: page.title ?? query,
        pageId: page.pageid ?? 0,
        image: page.original?.source ?? null,
        extract: page.extract,
        parsed: parseBioFromExtract(page.extract),
      }
      cache[fullName] = bio
      return bio
    } catch (e) {
      if (e instanceof Error && e.message === "RATE_LIMITED") {
        throw e
      }
      const msg = e instanceof Error ? e.message : String(e)
      console.warn(`wiki search failed for "${query}": ${msg}`)
      break
    }
  }
  cache[fullName] = null
  return null
}

async function backfillTeams() {
  const db = getDb()
  const leagueRow = await db
    .select()
    .from(leagues)
    .where(eq(leagues.slug, "euroleague"))
    .limit(1)
  const league = leagueRow[0]
  if (!league) throw new Error("EuroLeague league not found")

  const colorMap = TEAM_COLORS_BY_SOURCE.euroleague ?? {}
  const totals = { updated: 0, skipped: 0, noMeta: 0 }

  const teamRows = await db
    .select()
    .from(teams)
    .where(eq(teams.leagueId, league.id))

  for (const t of teamRows) {
    const meta = EUROLEAGUE_TEAM_META[t.sourceId]
    if (!meta) {
      totals.noMeta++
      console.warn(`[team] no static meta for ${t.sourceId} (${t.name})`)
      continue
    }
    const color = colorMap[t.sourceId] ?? null
    const update: Partial<typeof teams.$inferInsert> = {}
    if (!t.logoUrl && meta.logoUrl) update.logoUrl = meta.logoUrl
    if (!t.city && meta.city) update.city = meta.city
    if (!t.arena && meta.arena) update.arena = meta.arena
    if (!t.websiteUrl && meta.websiteUrl) update.websiteUrl = meta.websiteUrl
    if (!t.foundedYear && meta.foundedYear) update.foundedYear = meta.foundedYear
    if (!t.primaryColor && color) update.primaryColor = color
    if (Object.keys(update).length === 0) {
      totals.skipped++
      continue
    }
    await db.update(teams).set(update).where(eq(teams.id, t.id))
    totals.updated++
    console.log(`[team] ${t.sourceId} ${t.name}: ${Object.keys(update).join(", ")}`)
  }
  return totals
}

async function backfillCoaches() {
  const db = getDb()
  const leagueRow = await db
    .select()
    .from(leagues)
    .where(eq(leagues.slug, "euroleague"))
    .limit(1)
  const league = leagueRow[0]
  if (!league) throw new Error("EuroLeague league not found")

  const teamRows = await db
    .select({ id: teams.id, sourceId: teams.sourceId, name: teams.name })
    .from(teams)
    .where(eq(teams.leagueId, league.id))

  const teamIdByCode = new Map(teamRows.map((t) => [t.sourceId, t.id]))
  const totals = { inserted: 0, updated: 0, skipped: 0 }

  for (const [code, list] of Object.entries(EUROLEAGUE_COACHES_2024_25)) {
    const teamId = teamIdByCode.get(code)
    if (!teamId) {
      console.warn(`[coach] no team for code ${code}`)
      continue
    }
    for (const c of list) {
      const sourceId = `${code}-${slugify(c.fullName)}-${c.role}`
      const existing = await db
        .select()
        .from(coaches)
        .where(and(eq(coaches.source, "euroleague"), eq(coaches.sourceId, sourceId)))
        .limit(1)
      const row = {
        teamId,
        leagueId: league.id,
        source: "euroleague" as const,
        sourceId,
        fullName: c.fullName,
        slug: slugify(c.fullName),
        role: c.role,
        nationality: c.nationality ?? null,
        age: c.age ?? null,
        photoUrl: null,
        licenseType: null,
      }
      if (existing[0]) {
        await db
          .update(coaches)
          .set({
            fullName: row.fullName,
            role: row.role,
            nationality: row.nationality,
            age: row.age,
            teamId: row.teamId,
          })
          .where(eq(coaches.id, existing[0].id))
        totals.updated++
        console.log(`[coach] updated ${code} / ${c.fullName} (${c.role})`)
      } else {
        await db.insert(coaches).values(row)
        totals.inserted++
        console.log(`[coach] inserted ${code} / ${c.fullName} (${c.role})`)
      }
    }
  }
  return totals
}

async function backfillPlayers(limit: number | null = null) {
  const db = getDb()
  const cache = loadCache()
  const playerRows = await db
    .select({
      id: players.id,
      sourceId: players.sourceId,
      fullName: players.fullName,
      photoUrl: players.photoUrl,
      position: players.position,
      nationality: players.nationality,
      birthdate: players.birthdate,
      heightCm: players.heightCm,
      weightKg: players.weightKg,
    })
    .from(players)
    .where(eq(players.source, "euroleague"))

  const todo = playerRows.filter(
    (p) => !p.photoUrl || !p.position || !p.nationality || !p.birthdate || !p.heightCm || !p.weightKg,
  )
  const target = limit ? todo.slice(0, limit) : todo
  console.log(`[player] ${todo.length}/${playerRows.length} need enrichment; processing ${target.length}`)

  const totals = { matched: 0, missing: 0, updated: 0, rateLimited: 0 }
  for (let i = 0; i < target.length; i++) {
    const p = target[i]!
    process.stdout.write(`  [${i + 1}/${target.length}] ${p.fullName} ... `)
    let bio: WikiBio | null
    try {
      bio = await searchWikipedia(p.fullName, cache)
    } catch (e) {
      if (e instanceof Error && e.message === "RATE_LIMITED") {
        totals.rateLimited++
        process.stdout.write("RATE LIMITED — pausing 30s\n")
        await delay(30_000)
        i--
        continue
      }
      throw e
    }
    if (!bio) {
      totals.missing++
      process.stdout.write("no wiki match\n")
    } else {
      totals.matched++
      const update: Partial<typeof players.$inferInsert> = {}
      if (!p.photoUrl && bio.image) update.photoUrl = bio.image
      if (!p.birthdate && bio.parsed.birthdate) update.birthdate = bio.parsed.birthdate
      if (!p.nationality && bio.parsed.nationality) update.nationality = bio.parsed.nationality
      if (!p.position && bio.parsed.position) update.position = bio.parsed.position
      if (!p.heightCm && bio.parsed.heightCm) update.heightCm = bio.parsed.heightCm
      if (!p.weightKg && bio.parsed.weightKg) update.weightKg = bio.parsed.weightKg
      if (Object.keys(update).length > 0) {
        await db.update(players).set(update).where(eq(players.id, p.id))
        totals.updated++
        process.stdout.write(`+${Object.keys(update).length} fields (${bio.title})\n`)
      } else {
        process.stdout.write(`no new fields (${bio.title})\n`)
      }
    }
    if ((i + 1) % 25 === 0) saveCache(cache)
  }
  saveCache(cache)
  return totals
}

async function main() {
  const args = process.argv.slice(2)
  const onlyFlag = (name: string) => args.includes(`--${name}`)
  const limitIdx = args.indexOf("--limit")
  const limit = limitIdx >= 0 ? Number(args[limitIdx + 1]) || 5 : null

  console.log("=== EuroLeague backfill ===")
  if (!onlyFlag("skip-teams")) {
    console.log("\n--- Teams ---")
    const t = await backfillTeams()
    console.log(t)
  }
  if (!onlyFlag("skip-coaches")) {
    console.log("\n--- Coaches ---")
    const c = await backfillCoaches()
    console.log(c)
  }
  if (!onlyFlag("skip-players")) {
    console.log("\n--- Players (Wikipedia) ---")
    const p = await backfillPlayers(limit)
    console.log(p)
  }
  closeDb()
  console.log("\nDone.")
}

main().catch((err) => {
  console.error(err)
  closeDb()
  process.exit(1)
})
