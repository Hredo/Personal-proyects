/*
 * Fills null E2025 stat columns (shooting, oreb/dreb, fouls, minutes) and
 * missing player headshots from the official EuroLeague v3 accumulated
 * statistics feed. Only writes columns that are currently null.
 * Usage: pnpm exec tsx scripts/backfill-euroleague-stats.ts [--dry]
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

const DRY = process.argv.includes("--dry")
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36"

function norm(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function aliasToNormName(alias: string): string {
  const [last, first] = alias.split(",").map((p) => p.trim())
  return norm(first ? `${first} ${last}` : alias)
}

type ApiStatLine = {
  player: {
    code: string
    name: string
    imageUrl?: string | null
    team: { code: string; name: string }
  }
  gamesPlayed: number
  minutesPlayed: number
  pointsScored: number
  twoPointersMade: number
  twoPointersAttempted: number
  threePointersMade: number
  threePointersAttempted: number
  freeThrowsMade: number
  freeThrowsAttempted: number
  offensiveRebounds: number
  defensiveRebounds: number
  totalRebounds: number
  assists: number
  steals: number
  turnovers: number
  blocks: number
  foulsCommited: number
  pir: number
}

async function fetchAllStats(): Promise<ApiStatLine[]> {
  const out: ApiStatLine[] = []
  for (let offset = 0; ; offset += 200) {
    const url =
      "https://api-live.euroleague.net/v3/competitions/E/statistics/players/traditional" +
      `?seasonMode=Single&seasonCode=E2025&statisticMode=accumulated&limit=200&offset=${offset}`
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "application/json" },
      signal: AbortSignal.timeout(30_000),
    })
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
    const page = (await res.json()) as { total: number; players: ApiStatLine[] }
    out.push(...page.players)
    if (out.length >= page.total || page.players.length === 0) break
    await new Promise((r) => setTimeout(r, 400))
  }
  return out
}

async function main() {
  loadEnv()
  const sql = postgres(process.env.DATABASE_URL!, {
    prepare: false,
    connect_timeout: 20,
  })
  try {
    const apiLines = await fetchAllStats()
    console.log(`[api] ${apiLines.length} accumulated stat lines`)
    const byName = new Map<string, ApiStatLine>()
    for (const line of apiLines) {
      const key = aliasToNormName(line.player.name)
      // A traded player has one line per club; keep the one with more games.
      const prior = byName.get(key)
      if (!prior || line.gamesPlayed > prior.gamesPlayed) byName.set(key, line)
    }
    // Surname-unique fallback for diminutives (Dinos/Konstantinos etc.).
    const bySurname = new Map<string, ApiStatLine | null>()
    for (const [key, line] of byName) {
      const surname = key.split(" ").pop() ?? ""
      if (!surname) continue
      const prior = bySurname.get(surname)
      if (prior === undefined) bySurname.set(surname, line)
      else if (prior !== null && prior.player.code !== line.player.code) {
        bySurname.set(surname, null)
      }
    }
    const lookup = (dbName: string): ApiStatLine | undefined => {
      const key = norm(dbName)
      const exact = byName.get(key)
      if (exact) return exact
      const surname = key.split(" ").pop() ?? ""
      return bySurname.get(surname) ?? undefined
    }

    const rows = await sql<
      {
        stat_id: string
        player_id: string
        name: string
        games_played: number
        minutes_total: number | null
        fg_made: number | null
        fg_attempted: number | null
        three_made: number | null
        three_attempted: number | null
        ft_made: number | null
        ft_attempted: number | null
        offensive_rebounds: number | null
        defensive_rebounds: number | null
        fouls_total: number | null
        steals_total: number | null
        blocks_total: number | null
        turnovers_total: number | null
        rebounds_total: number | null
        assists_total: number | null
        points_total: number | null
      }[]
    >`
      select pss.id as stat_id, p.id as player_id,
        p.first_name || ' ' || p.last_name as name,
        pss.games_played, pss.minutes_total,
        pss.fg_made, pss.fg_attempted, pss.three_made, pss.three_attempted,
        pss.ft_made, pss.ft_attempted, pss.offensive_rebounds, pss.defensive_rebounds,
        pss.fouls_total, pss.steals_total, pss.blocks_total, pss.turnovers_total,
        pss.rebounds_total, pss.assists_total, pss.points_total
      from player_season_stats pss
      join players p on p.id = pss.player_id
      join leagues l on l.id = pss.league_id
      join seasons s on s.id = pss.season_id
      where l.slug = 'euroleague' and s.is_current
        and (pss.fg_made is null or pss.three_made is null or pss.ft_made is null
          or pss.offensive_rebounds is null or pss.fouls_total is null
          or pss.minutes_total is null or pss.rebounds_total is null
          or pss.assists_total is null or pss.steals_total is null
          or pss.blocks_total is null or pss.turnovers_total is null)
    `
    console.log(`[stats] ${rows.length} rows with null columns`)
    let updated = 0
    for (const r of rows) {
      const api = lookup(r.name)
      if (!api) {
        console.warn(`  [stats] no api line for ${r.name}`)
        continue
      }
      const fills: Record<string, number> = {}
      const set = (col: string, current: number | null, value: number | undefined) => {
        if (current == null && value != null && Number.isFinite(value)) {
          fills[col] = Math.round(value)
        }
      }
      set("minutes_total", r.minutes_total, api.minutesPlayed)
      set("fg_made", r.fg_made, api.twoPointersMade + api.threePointersMade)
      set("fg_attempted", r.fg_attempted, api.twoPointersAttempted + api.threePointersAttempted)
      set("three_made", r.three_made, api.threePointersMade)
      set("three_attempted", r.three_attempted, api.threePointersAttempted)
      set("ft_made", r.ft_made, api.freeThrowsMade)
      set("ft_attempted", r.ft_attempted, api.freeThrowsAttempted)
      set("offensive_rebounds", r.offensive_rebounds, api.offensiveRebounds)
      set("defensive_rebounds", r.defensive_rebounds, api.defensiveRebounds)
      set("fouls_total", r.fouls_total, api.foulsCommited)
      set("rebounds_total", r.rebounds_total, api.totalRebounds)
      set("assists_total", r.assists_total, api.assists)
      set("steals_total", r.steals_total, api.steals)
      set("blocks_total", r.blocks_total, api.blocks)
      set("turnovers_total", r.turnovers_total, api.turnovers)
      set("points_total", r.points_total, api.pointsScored)
      if (Object.keys(fills).length === 0) continue
      if (DRY) {
        console.log(`  [dry] ${r.name}: ${Object.keys(fills).join(",")}`)
        continue
      }
      await sql`update player_season_stats set ${sql(fills)} where id = ${r.stat_id}`
      updated++
      console.log(`  ${r.name}: ${Object.keys(fills).join(",")}`)
    }
    console.log(`[stats] updated=${updated}`)

    /* ---- player headshots still missing ---- */
    const noImage = await sql<{ id: string; name: string }[]>`
      select distinct p.id, p.first_name || ' ' || p.last_name as name
      from players p
      join player_season_stats pss on pss.player_id = p.id
      join leagues l on l.id = pss.league_id
      join seasons s on s.id = pss.season_id
      where l.slug = 'euroleague' and s.is_current and p.image_url is null
    `
    console.log(`[images] ${noImage.length} players without image`)
    let imgUpdated = 0
    for (const p of noImage) {
      const api = lookup(p.name)
      const img = api?.player.imageUrl
      if (!img) continue
      if (DRY) {
        console.log(`  [dry] ${p.name}: image`)
        continue
      }
      await sql`update players set image_url = ${img} where id = ${p.id}`
      imgUpdated++
      console.log(`  ${p.name}: image`)
    }
    console.log(`[images] updated=${imgUpdated}`)
  } finally {
    await sql.end()
  }
}

main().catch((e) => {
  console.error("BACKFILL FAILED:", e?.message ?? e)
  process.exit(1)
})
