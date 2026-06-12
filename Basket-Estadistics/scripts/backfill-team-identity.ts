/*
 * Team identity backfill, league-agnostic:
 *  - foundedYear via Wikipedia (wikidata P571 "inception")
 *  - primary/secondary colors from the club crest (dominant hues via sharp)
 * Only fills null columns. Usage:
 *   pnpm exec tsx scripts/backfill-team-identity.ts <league-slug> [--dry]
 */
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import postgres from "postgres"
import { PNG } from "pngjs"
import jpeg from "jpeg-js"

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

async function getJson<T>(url: string): Promise<T | null> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": UA, Accept: "application/json" },
        signal: AbortSignal.timeout(20_000),
      })
      if (res.status === 429) {
        const wait = 20_000 * attempt
        console.warn(`    [429] backing off ${wait / 1000}s — ${url.slice(0, 90)}`)
        await sleep(wait)
        continue
      }
      if (!res.ok) {
        console.warn(`    [http ${res.status}] ${url.slice(0, 120)}`)
        return null
      }
      return (await res.json()) as T
    } catch (e) {
      console.warn(`    [fetch fail] ${(e as Error).message} ${url.slice(0, 100)}`)
      await sleep(3000)
    }
  }
  return null
}

/* ---------- founded year via Wikipedia/Wikidata ---------- */

type SearchResult = { query?: { search?: { title: string }[] } }
type PageProps = {
  query?: { pages?: Record<string, { pageprops?: { wikibase_item?: string } }> }
}
type WikidataEntity = {
  entities?: Record<
    string,
    { claims?: { P571?: { mainsnak?: { datavalue?: { value?: { time?: string } } } }[] } }
  >
}

async function foundedYearFor(teamName: string): Promise<number | null> {
  const search = await getJson<SearchResult>(
    "https://en.wikipedia.org/w/api.php?action=query&list=search&format=json&srlimit=1" +
      `&srsearch=${encodeURIComponent(`${teamName} basketball club`)}`,
  )
  const title = search?.query?.search?.[0]?.title
  if (!title) return null
  await sleep(1200)
  const props = await getJson<PageProps>(
    "https://en.wikipedia.org/w/api.php?action=query&prop=pageprops&format=json" +
      `&titles=${encodeURIComponent(title)}`,
  )
  const pages = props?.query?.pages ?? {}
  const item = Object.values(pages)[0]?.pageprops?.wikibase_item
  if (!item) return null
  await sleep(1200)
  const entity = await getJson<WikidataEntity>(
    `https://www.wikidata.org/wiki/Special:EntityData/${item}.json`,
  )
  const time =
    entity?.entities?.[item]?.claims?.P571?.[0]?.mainsnak?.datavalue?.value?.time
  const year = time?.match(/^\+(\d{4})/)?.[1]
  if (!year) return null
  const n = Number(year)
  return n >= 1850 && n <= 2026 ? n : null
}

/* ---------- dominant crest colors ---------- */

function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")
  )
}

/** Wikipedia-hosted SVGs have a server-side PNG thumbnail service. */
function rasterizableUrl(logoUrl: string): string {
  const m = logoUrl.match(
    /^https?:\/\/upload\.wikimedia\.org\/wikipedia\/([^/]+)\/(?!thumb\/)(\w)\/(\w\w)\/([^/]+\.svg)$/i,
  )
  if (m) {
    return `https://upload.wikimedia.org/wikipedia/${m[1]}/thumb/${m[2]}/${m[3]}/${m[4]}/256px-${m[4]}.png`
  }
  return logoUrl
}

async function crestColors(
  rawLogoUrl: string,
): Promise<{ primary: string; secondary: string | null } | null> {
  const logoUrl = rasterizableUrl(rawLogoUrl)
  try {
    const res = await fetch(logoUrl, {
      headers: { "User-Agent": UA },
      signal: AbortSignal.timeout(20_000),
    })
    if (!res.ok) return null
    const buf = Buffer.from(await res.arrayBuffer())
    const type = res.headers.get("content-type") ?? ""
    let data: Buffer | Uint8Array
    let width: number
    let height: number
    if (type.includes("png") || logoUrl.toLowerCase().includes(".png")) {
      const png = PNG.sync.read(buf)
      data = png.data
      width = png.width
      height = png.height
    } else if (/jpe?g/.test(type) || /\.jpe?g/i.test(logoUrl)) {
      const img = jpeg.decode(buf, { useTArray: true, maxMemoryUsageInMB: 64 })
      data = img.data
      width = img.width
      height = img.height
    } else {
      console.warn(`    [crest skip] unsupported type ${type} ${logoUrl.slice(0, 90)}`)
      return null
    }
    // Sample at most ~64x64 worth of pixels to keep this cheap on big crests.
    const step = Math.max(1, Math.floor(Math.max(width, height) / 64))
    const counts = new Map<string, { n: number; r: number; g: number; b: number }>()
    for (let y = 0; y < height; y += step) {
      for (let x = 0; x < width; x += step) {
        const i = (y * width + x) * 4
        const r = data[i]!
        const g = data[i + 1]!
        const b = data[i + 2]!
        const a = data[i + 3]!
        if (a < 200) continue
        const max = Math.max(r, g, b)
        const min = Math.min(r, g, b)
        // Skip near-white/near-black/grey pixels — backgrounds and outlines.
        if (max > 235 && min > 215) continue
        if (max < 40) continue
        if (max - min < 24) continue
        // Quantize to 32-step buckets so shades pool together.
        const key = `${r >> 5}-${g >> 5}-${b >> 5}`
        const e = counts.get(key)
        if (e) {
          e.n++
          e.r += r
          e.g += g
          e.b += b
        } else counts.set(key, { n: 1, r, g, b })
      }
    }
    const ranked = [...counts.values()].sort((a, b) => b.n - a.n)
    if (ranked.length === 0) return null
    const avg = (e: { n: number; r: number; g: number; b: number }) =>
      rgbToHex(Math.round(e.r / e.n), Math.round(e.g / e.n), Math.round(e.b / e.n))
    const primary = avg(ranked[0]!)
    // Secondary: next bucket that is far enough from primary to read as a
    // different colour rather than a shade.
    const dist = (a: { r: number; g: number; b: number; n: number }, b2: { r: number; g: number; b: number; n: number }) => {
      const ar = a.r / a.n, ag = a.g / a.n, ab = a.b / a.n
      const br = b2.r / b2.n, bg = b2.g / b2.n, bb = b2.b / b2.n
      return Math.abs(ar - br) + Math.abs(ag - bg) + Math.abs(ab - bb)
    }
    const second = ranked.slice(1).find((e) => e.n >= ranked[0]!.n * 0.12 && dist(ranked[0]!, e) > 120)
    return { primary, secondary: second ? avg(second) : null }
  } catch (e) {
    console.warn(`    [crest fail] ${(e as Error).message} ${logoUrl.slice(0, 100)}`)
    return null
  }
}

async function main() {
  if (!LEAGUE) {
    console.error("usage: tsx scripts/backfill-team-identity.ts <league-slug> [--dry]")
    process.exit(1)
  }
  loadEnv()
  const sql = postgres(process.env.DATABASE_URL!, { prepare: false, connect_timeout: 20 })
  try {
    const teams = await sql<
      {
        id: string
        name: string
        logo_url: string | null
        founded_year: number | null
        primary_color: string | null
        secondary_color: string | null
      }[]
    >`
      select distinct t.id, t.name, t.logo_url, t.founded_year,
        t.primary_color, t.secondary_color
      from teams t
      join player_season_stats pss on pss.team_id = t.id
      join leagues l on l.id = pss.league_id
      where l.slug = ${LEAGUE}
      order by t.name
    `
    console.log(`[${LEAGUE}] ${teams.length} teams`)
    for (const t of teams) {
      const fills: Record<string, string | number> = {}
      if (t.founded_year == null) {
        const year = await foundedYearFor(t.name)
        if (year) fills.founded_year = year
        await sleep(1500)
      }
      if (t.primary_color == null && t.logo_url) {
        const colors = await crestColors(t.logo_url)
        if (colors) {
          fills.primary_color = colors.primary
          if (t.secondary_color == null && colors.secondary) {
            fills.secondary_color = colors.secondary
          }
        }
      }
      if (Object.keys(fills).length === 0) {
        console.log(`  ${t.name}: nothing to fill`)
        continue
      }
      if (DRY) {
        console.log(`  [dry] ${t.name}:`, fills)
        continue
      }
      await sql`update teams set ${sql(fills)} where id = ${t.id}`
      console.log(`  ${t.name}:`, fills)
    }
  } finally {
    await sql.end()
  }
}

main().catch((e) => {
  console.error("BACKFILL FAILED:", e?.message ?? e)
  process.exit(1)
})
