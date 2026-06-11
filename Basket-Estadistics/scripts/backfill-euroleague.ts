/*
 * Backfills EuroLeague 2025-26 (E2025) from the official feeds API:
 *  - players: headshot, position, height, weight, nationality (null fields only)
 *  - teams: website, arena, city, crest (null fields only)
 *  - coaches: photo + age (null fields only)
 * Usage: pnpm exec tsx scripts/backfill-euroleague.ts [--limit N] [--dry]
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

const API = "https://api-live.euroleague.net/v2/competitions/E/seasons/E2025"
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36"

const ARGS = new Set(process.argv.slice(2))
const DRY = ARGS.has("--dry")
const LIMIT = (() => {
  const i = process.argv.indexOf("--limit")
  return i >= 0 ? Number(process.argv[i + 1]) : Infinity
})()

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

async function getJson<T>(url: string): Promise<T> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": UA, Accept: "application/json" },
        signal: AbortSignal.timeout(30_000),
      })
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
      return (await res.json()) as T
    } catch (err) {
      if (attempt === 3) throw err
      await sleep(1500 * attempt)
    }
  }
  throw new Error("unreachable")
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

/** "NUNN, KENDRICK" -> "kendrick nunn" */
function aliasToNormName(alias: string): string {
  const [last, first] = alias.split(",").map((p) => p.trim())
  return norm(first ? `${first} ${last}` : alias)
}

function titleCase(s: string): string {
  return s
    .toLowerCase()
    .replace(/(^|[\s\-'.])\p{L}/gu, (c) => c.toUpperCase())
    .trim()
}

function ageFromBirthDate(iso: string | undefined): number | undefined {
  if (!iso) return undefined
  const birth = new Date(iso)
  if (Number.isNaN(birth.getTime())) return undefined
  const now = new Date()
  let age = now.getUTCFullYear() - birth.getUTCFullYear()
  const md = now.getUTCMonth() - birth.getUTCMonth()
  if (md < 0 || (md === 0 && now.getUTCDate() < birth.getUTCDate())) age--
  return age > 14 && age < 100 ? age : undefined
}

const POSITION_MAP: Record<string, string> = {
  Guard: "G",
  Forward: "F",
  Center: "C",
}

type ApiPerson = {
  person: {
    code: string
    alias: string
    passportName?: string | null
    passportSurname?: string | null
    jerseyName?: string | null
    country?: { name?: string } | null
    height?: number
    weight?: number
    birthDate?: string
    images?: { headshot?: string | null } | null
  }
  type: string
  typeName?: string
  active?: boolean
  positionName?: string | null
  images?: { headshot?: string | null; action?: string | null } | null
  club?: { code?: string } | null
}

type ApiClub = {
  code: string
  name: string
  images?: { crest?: string | null } | null
  website?: string | null
  city?: string | null
}

type ApiVenueGroup = {
  clubCode: string
  venues: { name: string; capacity?: number; active?: boolean }[]
}

const EXTRA_SLUG_TO_CODE: Record<string, string> = {
  // DB slugs come from the sync's own slugger, not BR slugs.
  "maccabi-playtika-tel-aviv": "TEL",
  "crvena-zvezda-meridianbet": "RED",
  "ea7-emporio-armani-milano": "MIL",
  "fenerbahce-beko": "ULK",
  "bayern-munchen": "MUN",
  baskonia: "BAS",
  "ldlc-asvel": "ASV",
  "partizan-mozzart-bet": "PAR",
  "dubai-basketball": "DUB",
  "hapoel-ibi-tel-aviv": "TLV",
  "valencia-basket": "VAL",
}

async function main() {
  loadEnv()
  const { EUROLEAGUE_BR_TO_CODE } = await import(
    "../src/lib/sources/euroleague-teams"
  )
  const sql = postgres(process.env.DATABASE_URL!, {
    prepare: false,
    connect_timeout: 20,
  })
  try {
    /* ---------- fetch API data ---------- */
    const fetchPeople = async (season: string): Promise<ApiPerson[]> => {
      const out: ApiPerson[] = []
      const base = `https://api-live.euroleague.net/v2/competitions/E/seasons/${season}`
      for (let offset = 0; ; offset += 500) {
        const page = await getJson<{ data: ApiPerson[] }>(
          `${base}/people?limit=500&offset=${offset}`,
        )
        out.push(...page.data)
        if (page.data.length < 500) break
        await sleep(400)
      }
      return out
    }
    const people = await fetchPeople("E2025")
    // Previous season as fallback: bios/headshots of players who left the
    // competition before E2025 (ALBA Berlin, retirees) don't change.
    const peoplePrev = await fetchPeople("E2024")
    const clubs = (await getJson<{ data: ApiClub[] }>(`${API}/clubs?limit=50`))
      .data
    const venueGroups = await getJson<ApiVenueGroup[]>(
      `${API}/venues?limit=100`,
    )
    console.log(
      `[api] people E2025=${people.length} E2024=${peoplePrev.length} clubs=${clubs.length} venueGroups=${venueGroups.length}`,
    )

    // Index people under several name keys; prefer headshot, then active,
    // then current season.
    const score = (p: ApiPerson, current: boolean) =>
      (p.images?.headshot || p.person.images?.headshot ? 4 : 0) +
      (p.active ? 2 : 0) +
      (current ? 1 : 0)
    const playerByName = new Map<string, { p: ApiPerson; s: number }>()
    const coachByName = new Map<string, { p: ApiPerson; s: number }>()
    const keysFor = (p: ApiPerson): string[] => {
      const keys = new Set<string>()
      const alias = p.person.alias ?? ""
      if (alias) keys.add(aliasToNormName(alias))
      const first = (p.person.passportName ?? "").trim()
      const last = (p.person.passportSurname ?? "").trim()
      if (first && last) {
        keys.add(norm(`${first} ${last}`))
        // First given name + first surname ("Guillermo Hernangomez Geuer"
        // -> "guillermo hernangomez").
        const f0 = norm(first).split(" ")[0]
        const l0 = norm(last).split(" ")[0]
        if (f0 && l0) keys.add(`${f0} ${l0}`)
      }
      keys.delete("")
      return [...keys]
    }
    const register = (
      bucket: Map<string, { p: ApiPerson; s: number }>,
      p: ApiPerson,
      current: boolean,
    ) => {
      const s = score(p, current)
      for (const key of keysFor(p)) {
        const prior = bucket.get(key)
        if (!prior || s > prior.s) bucket.set(key, { p, s })
      }
    }
    for (const p of people) {
      register(p.type === "J" ? playerByName : coachByName, p, true)
    }
    for (const p of peoplePrev) {
      register(p.type === "J" ? playerByName : coachByName, p, false)
    }
    // Surname-unique fallback index (player names like API alias "TONUT").
    const playerBySurname = new Map<string, { p: ApiPerson; s: number } | null>()
    for (const [key, entry] of playerByName) {
      const surname = key.split(" ").pop() ?? ""
      if (!surname) continue
      const prior = playerBySurname.get(surname)
      if (prior === undefined) playerBySurname.set(surname, entry)
      else if (prior !== null && prior.p.person.code !== entry.p.person.code) {
        playerBySurname.set(surname, null) // ambiguous
      }
    }
    const lookupPlayer = (dbName: string): ApiPerson | undefined => {
      const key = norm(dbName)
      const exact = playerByName.get(key)
      if (exact) return exact.p
      const parts = key.split(" ")
      const surname = parts[parts.length - 1]
      const bySurname = playerBySurname.get(surname)
      if (bySurname) {
        const candidate = bySurname.p
        const candKeys = keysFor(candidate).join(" ")
        // Accept when the first initial agrees or the API key is surname-only.
        const initial = parts[0]?.[0]
        if (!initial || candKeys.split(" ")[0]?.[0] === initial || candKeys === surname) {
          return candidate
        }
      }
      return undefined
    }

    const venueByClub = new Map<string, string>()
    for (const vg of venueGroups) {
      const active = vg.venues.find((v) => v.active) ?? vg.venues[0]
      if (active?.name) venueByClub.set(vg.clubCode, titleCase(active.name))
    }
    const clubByCode = new Map(clubs.map((c) => [c.code, c]))

    /* ---------- players ---------- */
    const dbPlayers = await sql<
      {
        id: string
        name: string
        image_url: string | null
        position: string | null
        height_cm: number | null
        weight_kg: number | null
        nationality: string | null
      }[]
    >`
      select distinct p.id, p.first_name || ' ' || p.last_name as name,
        p.image_url, p.position, p.height_cm, p.weight_kg, p.nationality
      from players p
      join player_season_stats pss on pss.player_id = p.id
      join leagues l on l.id = pss.league_id
      join seasons s on s.id = pss.season_id
      where l.slug = 'euroleague' and s.is_current
        and (p.image_url is null or p.position is null or p.height_cm is null
          or p.weight_kg is null or p.nationality is null)
    `
    console.log(`[players] ${dbPlayers.length} with missing fields`)
    let pUpdated = 0
    let pMissed = 0
    let processed = 0
    const missedNames: string[] = []
    for (const dbp of dbPlayers) {
      if (processed >= LIMIT) break
      const api = lookupPlayer(dbp.name)
      if (!api) {
        pMissed++
        missedNames.push(dbp.name)
        continue
      }
      processed++
      const headshot =
        api.images?.headshot || api.person.images?.headshot || null
      const fills: Record<string, string | number> = {}
      if (!dbp.image_url && headshot) fills.image_url = headshot
      if (!dbp.position && api.positionName) {
        fills.position = POSITION_MAP[api.positionName] ?? api.positionName
      }
      if (!dbp.height_cm && api.person.height && api.person.height > 100) {
        fills.height_cm = api.person.height
      }
      if (!dbp.weight_kg && api.person.weight && api.person.weight > 40) {
        fills.weight_kg = api.person.weight
      }
      if (!dbp.nationality && api.person.country?.name) {
        fills.nationality = api.person.country.name
      }
      if (Object.keys(fills).length === 0) continue
      if (DRY) {
        console.log(`  [dry] ${dbp.name}: ${Object.keys(fills).join(",")}`)
        continue
      }
      await sql`update players set ${sql(fills)} where id = ${dbp.id}`
      pUpdated++
      console.log(`  ${dbp.name}: ${Object.keys(fills).join(",")}`)
    }
    console.log(`[players] updated=${pUpdated} unmatched=${pMissed}`)
    if (missedNames.length > 0 && ARGS.has("--debug-misses")) {
      const apiLastNames = new Map<string, string[]>()
      for (const key of playerByName.keys()) {
        const last = key.split(" ").pop() ?? ""
        const list = apiLastNames.get(last) ?? []
        list.push(key)
        apiLastNames.set(last, list)
      }
      for (const name of missedNames) {
        const last = norm(name).split(" ").pop() ?? ""
        const near = apiLastNames.get(last)
        console.log(
          `  [miss] "${name}" -> norm "${norm(name)}"${near ? ` | api near: ${near.join(" / ")}` : ""}`,
        )
      }
    }

    /* ---------- teams ---------- */
    const dbTeams = await sql<
      {
        id: string
        name: string
        slug: string
        city: string | null
        logo_url: string | null
        website: string | null
        arena: string | null
      }[]
    >`
      select distinct t.id, t.name, t.slug, t.city, t.logo_url, t.website, t.arena
      from teams t
      join player_season_stats pss on pss.team_id = t.id
      join leagues l on l.id = pss.league_id
      join seasons s on s.id = pss.season_id
      where l.slug = 'euroleague' and s.is_current
    `
    console.log(`[teams] ${dbTeams.length} euroleague teams`)
    let tUpdated = 0
    for (const t of dbTeams) {
      const code =
        EUROLEAGUE_BR_TO_CODE[t.slug.toLowerCase()] ??
        EXTRA_SLUG_TO_CODE[t.slug.toLowerCase()]
      const club = code ? clubByCode.get(code) : undefined
      if (!club) {
        console.warn(`  [teams] no club match for "${t.name}" (${t.slug})`)
        continue
      }
      const fills: Record<string, string> = {}
      if (!t.logo_url && club.images?.crest) fills.logo_url = club.images.crest
      if (!t.city && club.city) fills.city = titleCase(club.city)
      if (!t.website && club.website) fills.website = club.website.trim()
      const venue = venueByClub.get(club.code)
      if (!t.arena && venue) fills.arena = venue
      if (Object.keys(fills).length === 0) continue
      if (DRY) {
        console.log(`  [dry] ${t.name}: ${Object.keys(fills).join(",")}`)
        continue
      }
      await sql`update teams set ${sql(fills)} where id = ${t.id}`
      tUpdated++
      console.log(`  ${t.name}: ${Object.keys(fills).join(",")}`)
    }
    console.log(`[teams] updated=${tUpdated}`)

    /* ---------- coaches ---------- */
    const dbCoaches = await sql<
      {
        id: string
        full_name: string
        photo_url: string | null
        age: number | null
        nationality: string | null
      }[]
    >`
      select c.id, c.full_name, c.photo_url, c.age, c.nationality
      from coaches c
      join leagues l on l.id = c.league_id
      where l.slug = 'euroleague'
        and (c.photo_url is null or c.age is null or c.nationality is null)
    `
    console.log(`[coaches] ${dbCoaches.length} with missing fields`)
    let cUpdated = 0
    let cMissed = 0
    for (const c of dbCoaches) {
      const api = coachByName.get(norm(c.full_name))?.p
      if (!api) {
        cMissed++
        continue
      }
      const headshot =
        api.images?.headshot || api.person.images?.headshot || null
      const fills: Record<string, string | number> = {}
      if (!c.photo_url && headshot) fills.photo_url = headshot
      const age = ageFromBirthDate(api.person.birthDate)
      if (!c.age && age) fills.age = age
      if (!c.nationality && api.person.country?.name) {
        fills.nationality = api.person.country.name
      }
      if (Object.keys(fills).length === 0) continue
      if (DRY) {
        console.log(`  [dry] ${c.full_name}: ${Object.keys(fills).join(",")}`)
        continue
      }
      await sql`update coaches set ${sql(fills)} where id = ${c.id}`
      cUpdated++
      console.log(`  ${c.full_name}: ${Object.keys(fills).join(",")}`)
    }
    console.log(`[coaches] updated=${cUpdated} unmatched=${cMissed}`)
  } finally {
    await sql.end()
  }
}

main().catch((e) => {
  console.error("BACKFILL FAILED:", e?.message ?? e)
  process.exit(1)
})
