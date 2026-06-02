import {
  type SourceAdapter,
  type SourceCoach,
  type SourcePlayer,
  type SourceStats,
  type SourceTeam,
  type SourceTeamStats,
  SOURCE_META,
} from "@/lib/sources/types"
import { brSlugToEuroleagueCode } from "@/lib/sources/euroleague-teams"
import { parseBirthdate, parseHeightToCm, parseWeightToKg } from "@/lib/sync/slug"

const BR_BASE = "https://www.basketball-reference.com"
const BR_LEAGUE_PATH = "/international/euroleague"
const SEASON = SOURCE_META.euroleague.seasonCode

const SEASON_START_YEAR = (() => {
  const m = SEASON.match(/E(\d{4})/)
  return m ? Number(m[1]) : 2024
})()

const BR_SEASON_SUFFIX = String(SEASON_START_YEAR)

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "en-US,en;q=0.9",
    },
  })
  if (!res.ok) {
    throw new Error(`EL BR upstream ${res.status} ${res.statusText} (${url})`)
  }
  return res.text()
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
}

function getRowCells(row: string): Map<string, string> {
  const cells = new Map<string, string>()
  const cellRe = /<t[hd]\b[^>]*\bdata-stat="([^"]+)"[^>]*>([\s\S]*?)<\/t[hd]>/g
  let m: RegExpExecArray | null
  while ((m = cellRe.exec(row)) !== null) {
    const stat = m[1]
    const inner = m[2].replace(/<[^>]+>/g, "").trim()
    cells.set(stat, decodeEntities(inner))
  }
  return cells
}

function toNumberOrNull(s: string | undefined): number | undefined {
  if (s === undefined || s === "") return undefined
  const n = Number(s)
  return Number.isFinite(n) ? n : undefined
}

function percentileToDecimal(s: string | undefined): number | undefined {
  if (s === undefined || s === "") return undefined
  const n = Number(s)
  return Number.isFinite(n) ? Number((n / 100).toFixed(3)) : undefined
}

function extractTableById(html: string, id: string): string {
  const re = new RegExp(`<table[^>]*\\bid="${id}"[\\s\\S]*?<\\/table>`, "i")
  const m = html.match(re)
  return m ? m[0] : ""
}

function rowsFromTable(tableHtml: string): string[] {
  if (!tableHtml) return []
  return tableHtml.match(/<tr\b[^>]*>[\s\S]*?<\/tr>/g) ?? []
}

function extractPlayerId(href: string | undefined): string | undefined {
  if (!href) return undefined
  const m = href.match(/\/international\/players\/([^/.]+)\.html/)
  return m ? m[1] : undefined
}

function extractTeamSlug(href: string | undefined): string | undefined {
  if (!href) return undefined
  const m = href.match(/\/international\/teams\/([^/]+)\//)
  return m ? m[1] : undefined
}

export const euroleagueAdapter: SourceAdapter = {
  id: "euroleague",
  displayName: SOURCE_META.euroleague.displayName,
  country: SOURCE_META.euroleague.country,
  season: SOURCE_META.euroleague.season,
  seasonCode: SEASON,

  async fetchTeams(): Promise<SourceTeam[]> {
    const url = `${BR_BASE}${BR_LEAGUE_PATH}/${SEASON_START_YEAR}.html`
    const html = await fetchHtml(url)
    const standingsHtml = extractTableById(html, "elg_standings")
    const rows = rowsFromTable(standingsHtml)
    const out: SourceTeam[] = []
    const seen = new Set<string>()
    for (const row of rows) {
      const teamCell = row.match(
        /<a[^>]*href=(?:"|')(\/international\/teams\/[^"']+\.html)(?:"|')[^>]*>([\s\S]*?)<\/a>/,
      )
      if (!teamCell) continue
      const name = decodeEntities(teamCell[2].replace(/<[^>]+>/g, "").trim())
      const slug = extractTeamSlug(teamCell[1])
      const teamCode = brSlugToEuroleagueCode(slug)
      if (!teamCode || !name || seen.has(teamCode)) continue
      seen.add(teamCode)
      out.push({
        sourceId: teamCode,
        name,
        country: "EU",
        logoUrl: undefined,
      })
    }
    return out
  },

  async fetchPlayers(): Promise<SourcePlayer[]> {
    const url = `${BR_BASE}${BR_LEAGUE_PATH}/${SEASON_START_YEAR}_totals.html`
    const html = await fetchHtml(url)
    const tableHtml = extractTableById(html, `totals-stats-${BR_SEASON_SUFFIX}`)
    const rows = rowsFromTable(tableHtml)
    const out: SourcePlayer[] = []
    const seen = new Set<string>()
    for (const row of rows) {
      const cells = getRowCells(row)
      const playerLink = row.match(
        /<a[^>]*href=(?:"|')(\/international\/players\/[^"']+\.html)(?:"|')/,
      )
      const id = extractPlayerId(playerLink?.[1])
      const name = cells.get("player")
      if (!id || !name || seen.has(id)) continue
      seen.add(id)
      const teamHref =
        row.match(
          /<a[^>]*href=(?:"|')(\/international\/teams\/[^"']+\.html)(?:"|')/,
        )?.[1] ?? undefined
      const teamCode = brSlugToEuroleagueCode(extractTeamSlug(teamHref))
      out.push({
        sourceId: id,
        fullName: name,
        birthdate: parseBirthdate(cells.get("birth_date")),
        nationality: cells.get("nationality"),
        position: cells.get("pos"),
        heightCm:
          toNumberOrNull(cells.get("height")) ??
          parseHeightToCm(cells.get("height")),
        weightKg: toNumberOrNull(cells.get("weight")) ?? parseWeightToKg(cells.get("weight")),
        teamSourceId: teamCode,
        photoUrl: undefined,
      })
    }
    return out
  },

  async fetchStats(): Promise<SourceStats[]> {
    const url = `${BR_BASE}${BR_LEAGUE_PATH}/${SEASON_START_YEAR}_per_game.html`
    const html = await fetchHtml(url)
    const tableHtml = extractTableById(
      html,
      `per_game-stats-${BR_SEASON_SUFFIX}`,
    )
    const rows = rowsFromTable(tableHtml)
    const out: SourceStats[] = []
    for (const row of rows) {
      const cells = getRowCells(row)
      const playerLink = row.match(
        /<a[^>]*href=(?:"|')(\/international\/players\/[^"']+\.html)(?:"|')/,
      )
      const id = extractPlayerId(playerLink?.[1])
      if (!id) continue
      const teamHref =
        row.match(
          /<a[^>]*href=(?:"|')(\/international\/teams\/[^"']+\.html)(?:"|')/,
        )?.[1] ?? undefined
      const teamCode = brSlugToEuroleagueCode(extractTeamSlug(teamHref))
      out.push({
        playerSourceId: id,
        season: SOURCE_META.euroleague.season,
        teamSourceId: teamCode,
        gamesPlayed: toNumberOrNull(cells.get("g")) ?? 0,
        minutesPerGame: toNumberOrNull(cells.get("mp_per_g")),
        points: toNumberOrNull(cells.get("pts_per_g")),
        rebounds: toNumberOrNull(cells.get("trb_per_g")),
        assists: toNumberOrNull(cells.get("ast_per_g")),
        steals: toNumberOrNull(cells.get("stl_per_g")),
        blocks: toNumberOrNull(cells.get("blk_per_g")),
        turnovers: toNumberOrNull(cells.get("tov_per_g")),
        fgPct: percentileToDecimal(cells.get("fg_pct")),
        threePct: percentileToDecimal(cells.get("fg3_pct")),
        ftPct: percentileToDecimal(cells.get("ft_pct")),
      })
    }
    return out
  },

  async fetchCoaches(): Promise<SourceCoach[]> {
    const url = `${BR_BASE}${BR_LEAGUE_PATH}/${SEASON_START_YEAR}.html`
    const html = await fetchHtml(url)
    const tableHtml = extractTableById(html, "coaches")
    const rows = rowsFromTable(tableHtml)
    const out: SourceCoach[] = []
    const seen = new Set<string>()
    for (const row of rows) {
      const cells = getRowCells(row)
      const name = cells.get("coach")
      if (!name) continue
      const coachId = name.toLowerCase().replace(/[^a-z0-9]+/g, "-")
      const teamHref =
        row.match(
          /<a[^>]*href=(?:"|')(\/international\/teams\/[^"']+\.html)(?:"|')/,
        )?.[1] ?? undefined
      const teamCode = brSlugToEuroleagueCode(extractTeamSlug(teamHref))
      const role = (cells.get("role") ?? "head_coach").toLowerCase()
      const normalizedRole: SourceCoach["role"] = role.includes("assistant")
        ? "assistant_coach"
        : "head_coach"
      const key = `${coachId}-${teamCode ?? "fa"}`
      if (seen.has(key)) continue
      seen.add(key)
      out.push({
        sourceId: key,
        fullName: name,
        role: normalizedRole,
        teamSourceId: teamCode,
      })
    }
    return out
  },

  async fetchTeamStats(): Promise<SourceTeamStats[]> {
    const url = `${BR_BASE}${BR_LEAGUE_PATH}/${SEASON_START_YEAR}.html`
    const html = await fetchHtml(url)
    const tableHtml = extractTableById(html, "team_stats_per_game")
    const rows = rowsFromTable(tableHtml)
    const out: SourceTeamStats[] = []
    for (const row of rows) {
      const cells = getRowCells(row)
      const teamHref =
        row.match(
          /<a[^>]*href=(?:"|')(\/international\/teams\/[^"']+\.html)(?:"|')/,
        )?.[1] ?? undefined
      const teamCode = brSlugToEuroleagueCode(extractTeamSlug(teamHref))
      if (!teamCode) continue
      const teamName = cells.get("team_name") ?? cells.get("team")
      if (!teamName) continue
      const g = toNumberOrNull(cells.get("g")) ?? 0
      const w = toNumberOrNull(cells.get("wins")) ?? 0
      const l = toNumberOrNull(cells.get("losses")) ?? 0
      const pts = toNumberOrNull(cells.get("pts_per_g"))
      const oppPts = toNumberOrNull(cells.get("opp_pts_per_g"))
      out.push({
        teamSourceId: teamCode,
        season: SOURCE_META.euroleague.season,
        gamesPlayed: g,
        wins: w,
        losses: l,
        winPct: g > 0 ? Number((w / g).toFixed(3)) : undefined,
        pointsFor: pts,
        pointsAgainst: oppPts,
        pace: toNumberOrNull(cells.get("pace")),
        offRtg: toNumberOrNull(cells.get("off_rtg")),
        defRtg: toNumberOrNull(cells.get("def_rtg")),
        netRtg:
          toNumberOrNull(cells.get("off_rtg")) != null &&
          toNumberOrNull(cells.get("def_rtg")) != null
            ? Number(
                (
                  (toNumberOrNull(cells.get("off_rtg")) ?? 0) -
                  (toNumberOrNull(cells.get("def_rtg")) ?? 0)
                ).toFixed(1),
              )
            : undefined,
      })
    }
    return out
  },
}
