/*
 * EuroLeague bio backfill via the official feeds API, with a far more tolerant
 * name matcher than backfill-euroleague.ts: the DB stores popular short names
 * ("Edy Tavares", "Facu Campazzo", "Mike James") while the API carries legal
 * names ("Walter Tavares", "Facundo Campazzo", "Michael James"). We match by
 * unique surname and by surname + first-initial (initial taken from passport
 * name, jersey name OR alias, which covers nicknames like Willy/Guillermo).
 *
 * Fills null columns only (players: image/position/height/weight/nationality;
 * coaches: photo/age/nationality; the lone Panathinaikos city gap).
 * Usage: pnpm exec tsx scripts/backfill-el-bio.ts [--dry]
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
const DRY = process.argv.includes("--dry")

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

const SUFFIXES = new Set(["jr", "sr", "ii", "iii", "iv"])
function stripSuffix(tokens: string[]): string[] {
  const t = [...tokens]
  while (t.length > 1 && SUFFIXES.has(t[t.length - 1])) t.pop()
  return t
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

// DB-normalized name -> EL person code, for players the heuristic can't resolve
// (extra surnames, swapped passport name/surname, ambiguous common surnames).
// Codes verified against api-live.euroleague.net people for E2025.
const MANUAL_PLAYER_CODE: Record<string, string> = {
  "joseba querejeta martinez de arenaza": "010788",
  "ousmane n diaye": "012058",
  "matt morgan": "012585",
  "ivan wolf": "012126", // spelled "Ivan Volf" in the EL feed
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
  active?: boolean
  positionName?: string | null
  images?: { headshot?: string | null } | null
  club?: { code?: string } | null
}

type ApiClub = {
  code: string
  name: string
  city?: string | null
  images?: { crest?: string | null } | null
}

function headshotOf(p: ApiPerson): string | null {
  return p.images?.headshot || p.person.images?.headshot || null
}

function titleCase(s: string): string {
  return s
    .toLowerCase()
    .replace(/(^|[\s\-'.])\p{L}/gu, (c) => c.toUpperCase())
    .trim()
}

async function main() {
  loadEnv()
  const sql = postgres(process.env.DATABASE_URL!, {
    prepare: false,
    connect_timeout: 20,
  })
  try {
    const fetchPeople = async (season: string): Promise<ApiPerson[]> => {
      const out: ApiPerson[] = []
      const base = `https://api-live.euroleague.net/v2/competitions/E/seasons/${season}`
      for (let offset = 0; ; offset += 500) {
        const page = await getJson<{ data: ApiPerson[] }>(
          `${base}/people?limit=500&offset=${offset}`,
        )
        out.push(...page.data)
        if (page.data.length < 500) break
        await sleep(300)
      }
      return out
    }
    const peopleCur = await fetchPeople("E2025")
    const peoplePrev = await fetchPeople("E2024")
    const clubs = (
      await getJson<{ data: ApiClub[] }>(
        "https://api-live.euroleague.net/v2/competitions/E/seasons/E2025/clubs?limit=50",
      )
    ).data
    console.log(
      `[api] people E2025=${peopleCur.length} E2024=${peoplePrev.length} clubs=${clubs.length}`,
    )

    /* ---- best record per person code (prefer headshot/active/current) ---- */
    const score = (p: ApiPerson, cur: boolean) =>
      (headshotOf(p) ? 4 : 0) + (p.active ? 2 : 0) + (cur ? 1 : 0)
    const byCode = new Map<string, { p: ApiPerson; s: number }>()
    const ingest = (list: ApiPerson[], cur: boolean) => {
      for (const p of list) {
        const code = p.person.code
        if (!code) continue
        const s = score(p, cur)
        const prior = byCode.get(code)
        if (!prior || s > prior.s) byCode.set(code, { p, s })
      }
    }
    ingest(peopleCur, true)
    ingest(peoplePrev, false)

    /* ---- surname + full-name indexes, split players vs non-players ---- */
    type Idx = {
      surname: Map<string, Set<string>>
      full: Map<string, string>
    }
    const mk = (): Idx => ({ surname: new Map(), full: new Map() })
    const players = mk()
    const coaches = mk()

    const addSurname = (idx: Idx, key: string, code: string) => {
      if (!key) return
      const set = idx.surname.get(key) ?? new Set()
      set.add(code)
      idx.surname.set(key, set)
    }
    const addFull = (idx: Idx, key: string, code: string) => {
      if (key) idx.full.set(key, code)
    }
    const initialsOf = (p: ApiPerson): Set<string> => {
      const out = new Set<string>()
      for (const src of [
        p.person.passportName,
        p.person.jerseyName,
        p.person.alias,
      ]) {
        const n = norm(src ?? "")
        const first = n.split(" ")[0]
        if (first) out.add(first[0])
      }
      return out
    }
    const codeInitials = new Map<string, Set<string>>()

    for (const [code, { p }] of byCode) {
      const idx = p.type === "J" ? players : coaches
      codeInitials.set(code, initialsOf(p))
      // surname keys: last token of passportSurname, jerseyName whole + last,
      // alias whole + last.
      const surnameSrcs = [
        p.person.passportSurname,
        p.person.jerseyName,
        p.person.alias,
      ]
      for (const src of surnameSrcs) {
        const n = norm(src ?? "")
        if (!n) continue
        const toks = n.split(" ")
        addSurname(idx, toks[toks.length - 1], code)
        if (toks.length > 1) addSurname(idx, n, code) // whole multiword surname
      }
      // full-name keys for exact matching
      const pn = norm(p.person.passportName ?? "")
      const ps = norm(p.person.passportSurname ?? "")
      if (pn && ps) {
        addFull(idx, `${pn} ${ps}`, code)
        addFull(idx, `${pn.split(" ")[0]} ${ps.split(" ").pop()}`, code)
      }
      // alias "Surname, First" -> "first surname"
      const alias = norm(p.person.alias ?? "")
      if (alias.includes(",")) {
        // norm() already stripped the comma to space; reconstruct via raw alias
      }
      const rawAlias = p.person.alias ?? ""
      if (rawAlias.includes(",")) {
        const [last, first] = rawAlias.split(",").map((x) => norm(x))
        if (first && last) addFull(idx, `${first} ${last}`, code)
      } else if (alias) {
        addFull(idx, alias, code)
      }
    }

    const matchCode = (idx: Idx, dbName: string): string | null => {
      const tokens = stripSuffix(norm(dbName).split(" ").filter(Boolean))
      if (tokens.length === 0) return null
      const full = tokens.join(" ")
      const fullHit = idx.full.get(full)
      if (fullHit) return fullHit
      // try first+last only
      if (tokens.length > 2) {
        const fl = `${tokens[0]} ${tokens[tokens.length - 1]}`
        const flHit = idx.full.get(fl)
        if (flHit) return flHit
      }
      // surname (try last token, and last-two-token compound like "de colo")
      const surnameKeys = [tokens[tokens.length - 1]]
      if (tokens.length >= 2) {
        surnameKeys.push(`${tokens[tokens.length - 2]} ${tokens[tokens.length - 1]}`)
      }
      const initial = tokens[0][0]
      for (const sk of surnameKeys) {
        const cands = idx.surname.get(sk)
        if (!cands || cands.size === 0) continue
        if (cands.size === 1) return [...cands][0]
        // disambiguate by first initial
        const byInitial = [...cands].filter((c) =>
          codeInitials.get(c)?.has(initial),
        )
        if (byInitial.length === 1) return byInitial[0]
      }
      return null
    }

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
    console.log(`\n[players] ${dbPlayers.length} with missing fields`)
    let pUpdated = 0
    const pUnmatched: string[] = []
    for (const dbp of dbPlayers) {
      const code =
        MANUAL_PLAYER_CODE[norm(dbp.name)] ?? matchCode(players, dbp.name)
      const entry = code ? byCode.get(code) : undefined
      if (!entry) {
        pUnmatched.push(dbp.name)
        continue
      }
      const api = entry.p
      const headshot = headshotOf(api)
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
      if (Object.keys(fills).length === 0) {
        console.log(`  ~ ${dbp.name}: matched ${code} but nothing to fill`)
        continue
      }
      if (DRY) {
        console.log(`  [dry] ${dbp.name} -> ${code}: ${Object.keys(fills).join(",")}`)
      } else {
        await sql`update players set ${sql(fills)} where id = ${dbp.id}`
        pUpdated++
        console.log(`  ${dbp.name}: ${Object.keys(fills).join(",")}`)
      }
    }
    console.log(
      `[players] ${DRY ? "would update" : "updated"}=${DRY ? dbPlayers.length - pUnmatched.length : pUpdated} unmatched=${pUnmatched.length}`,
    )
    if (pUnmatched.length) console.log(`  unmatched: ${pUnmatched.join(" | ")}`)

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
    console.log(`\n[coaches] ${dbCoaches.length} with missing fields`)
    let cUpdated = 0
    let cHeadshots = 0
    const cUnmatched: string[] = []
    for (const c of dbCoaches) {
      const code = matchCode(coaches, c.full_name)
      if (!code) {
        cUnmatched.push(c.full_name)
        continue
      }
      const api = byCode.get(code)!.p
      const headshot = headshotOf(api)
      if (headshot) cHeadshots++
      const fills: Record<string, string | number> = {}
      if (!c.photo_url && headshot) fills.photo_url = headshot
      const age = ageFromBirthDate(api.person.birthDate)
      if (!c.age && age) fills.age = age
      if (!c.nationality && api.person.country?.name) {
        fills.nationality = api.person.country.name
      }
      if (Object.keys(fills).length === 0) {
        console.log(`  ~ ${c.full_name}: matched ${code}, nothing to fill (headshot=${headshot ? "y" : "n"})`)
        continue
      }
      if (DRY) {
        console.log(`  [dry] ${c.full_name} -> ${code}: ${Object.keys(fills).join(",")}`)
      } else {
        await sql`update coaches set ${sql(fills)} where id = ${c.id}`
        cUpdated++
        console.log(`  ${c.full_name}: ${Object.keys(fills).join(",")}`)
      }
    }
    console.log(
      `[coaches] ${DRY ? "matched-with-fills shown above" : `updated=${cUpdated}`} unmatched=${cUnmatched.length} apiHeadshotsAvailable=${cHeadshots}`,
    )
    if (cUnmatched.length) console.log(`  unmatched: ${cUnmatched.join(" | ")}`)

    /* ---------- Panathinaikos city ---------- */
    const pan = clubs.find((c) => c.code === "PAN")
    if (pan?.city) {
      if (DRY) {
        console.log(`\n[teams] [dry] Panathinaikos city -> ${titleCase(pan.city)}`)
      } else {
        const res = await sql`
          update teams set city = ${titleCase(pan.city)}
          where slug = 'panathinaikos-aktor' and city is null
        `
        console.log(`\n[teams] Panathinaikos city set (${res.count} row)`)
      }
    }
  } finally {
    await sql.end()
  }
}

main().catch((e) => {
  console.error("EL BACKFILL FAILED:", e?.message ?? e)
  process.exit(1)
})
