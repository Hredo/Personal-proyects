/*
 * Coach photo + age backfill via Wikidata (structured, more reliable than the
 * REST summary): resolves the coach to a Wikidata human (P31=Q5), then reads
 * P18 (image -> Commons FilePath URL) and P569 (date of birth -> age).
 * Fills null columns only. League-agnostic.
 * Usage: pnpm exec tsx scripts/backfill-coach-wikidata.ts <league-slug> [--dry]
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

const LEAGUE = process.argv[2]
const DRY = process.argv.includes("--dry")
const UA = "globalhoopstats-backfill/1.0 (local dev tool; contact dev)"

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

async function getJson<T>(url: string): Promise<T | null> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": UA, Accept: "application/json" },
        signal: AbortSignal.timeout(20_000),
      })
      if (res.status === 429) {
        await sleep(15_000 * attempt)
        continue
      }
      if (!res.ok) return null
      return (await res.json()) as T
    } catch {
      await sleep(2500)
    }
  }
  return null
}

type SearchResult = { query?: { search?: { title: string; snippet?: string }[] } }
type PageProps = {
  query?: {
    pages?: Record<string, { pageprops?: { wikibase_item?: string } }>
  }
}
type Claim = {
  mainsnak?: {
    datavalue?: { value?: unknown }
  }
}
type WikidataEntity = {
  entities?: Record<
    string,
    { claims?: Record<string, Claim[]> }
  >
}

/** Find the Wikidata Q-id of a basketball coach by name. */
async function resolveEntity(name: string): Promise<string | null> {
  const search = await getJson<SearchResult>(
    "https://en.wikipedia.org/w/api.php?action=query&list=search&format=json&srlimit=3" +
      `&srsearch=${encodeURIComponent(`${name} basketball coach`)}`,
  )
  const hits = search?.query?.search ?? []
  if (hits.length === 0) return null
  // Prefer a hit whose snippet mentions basketball/coach.
  const ranked = [...hits].sort((a, b) => {
    const sa = /basketball|coach|baloncesto/i.test(a.snippet ?? "") ? 1 : 0
    const sb = /basketball|coach|baloncesto/i.test(b.snippet ?? "") ? 1 : 0
    return sb - sa
  })
  for (const hit of ranked.slice(0, 2)) {
    await sleep(700)
    const props = await getJson<PageProps>(
      "https://en.wikipedia.org/w/api.php?action=query&prop=pageprops&format=json" +
        `&titles=${encodeURIComponent(hit.title)}`,
    )
    const pages = props?.query?.pages ?? {}
    const item = Object.values(pages)[0]?.pageprops?.wikibase_item
    if (item) return item
  }
  return null
}

function commonsUrl(filename: string): string {
  // Special:FilePath redirects to the actual file; width keeps it light.
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(
    filename.replace(/ /g, "_"),
  )}?width=400`
}

function ageFromYear(y: number): number | undefined {
  const age = 2026 - y
  return age > 18 && age < 100 ? age : undefined
}

async function main() {
  if (!LEAGUE) {
    console.error(
      "usage: tsx scripts/backfill-coach-wikidata.ts <league-slug> [--dry]",
    )
    process.exit(1)
  }
  loadEnv()
  const sql = postgres(process.env.DATABASE_URL!, {
    prepare: false,
    connect_timeout: 20,
  })
  try {
    const rows = await sql<
      {
        id: string
        full_name: string
        role: string
        photo_url: string | null
        age: number | null
      }[]
    >`
      select c.id, c.full_name, c.role, c.photo_url, c.age
      from coaches c
      join leagues l on l.id = c.league_id
      where l.slug = ${LEAGUE} and (c.photo_url is null or c.age is null)
      order by case when c.role = 'head_coach' then 0 else 1 end, c.full_name
    `
    console.log(`[${LEAGUE}] ${rows.length} coaches missing photo or age`)
    let photoN = 0
    let ageN = 0
    const misses: string[] = []
    for (const c of rows) {
      const qid = await resolveEntity(c.full_name)
      await sleep(800)
      if (!qid) {
        misses.push(c.full_name)
        console.log(`  ${c.full_name}: no wikidata entity`)
        continue
      }
      const entity = await getJson<WikidataEntity>(
        `https://www.wikidata.org/wiki/Special:EntityData/${qid}.json`,
      )
      await sleep(500)
      const claims = entity?.entities?.[qid]?.claims
      if (!claims) {
        misses.push(c.full_name)
        continue
      }
      // must be a human
      const p31 = (claims.P31 ?? [])
        .map((cl) => (cl.mainsnak?.datavalue?.value as { id?: string })?.id)
        .filter(Boolean)
      if (!p31.includes("Q5")) {
        misses.push(`${c.full_name} (not a person: ${p31.join(",")})`)
        console.log(`  ${c.full_name}: ${qid} is not a human, skipping`)
        continue
      }
      const fills: Record<string, string | number> = {}
      if (!c.photo_url) {
        const img = claims.P18?.[0]?.mainsnak?.datavalue?.value
        if (typeof img === "string") fills.photo_url = commonsUrl(img)
      }
      if (c.age == null) {
        const dob = claims.P569?.[0]?.mainsnak?.datavalue?.value as
          | { time?: string }
          | undefined
        const y = dob?.time?.match(/^\+(\d{4})/)?.[1]
        if (y) {
          const age = ageFromYear(Number(y))
          if (age) fills.age = age
        }
      }
      if (Object.keys(fills).length === 0) {
        console.log(`  ${c.full_name}: ${qid} had nothing new`)
        continue
      }
      if (DRY) {
        console.log(`  [dry] ${c.full_name} (${qid}): ${Object.keys(fills).join(",")}`)
      } else {
        await sql`update coaches set ${sql(fills)} where id = ${c.id}`
        if (fills.photo_url) photoN++
        if (fills.age) ageN++
        console.log(`  ${c.full_name} (${qid}): ${Object.keys(fills).join(",")}`)
      }
    }
    console.log(
      `[${LEAGUE}] photos+=${photoN} ages+=${ageN} unresolved=${misses.length}`,
    )
    if (misses.length) console.log(`  unresolved: ${misses.join(" | ")}`)
  } finally {
    await sql.end()
  }
}

main().catch((e) => {
  console.error("WIKIDATA BACKFILL FAILED:", e?.message ?? e)
  process.exit(1)
})
