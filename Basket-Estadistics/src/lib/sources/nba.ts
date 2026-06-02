import { fetchJson } from "@/lib/sources/fetcher"
import {
  type SourceAdapter,
  type SourceCoach,
  type SourcePlayer,
  type SourceStats,
  type SourceTeam,
  type SourceTeamStats,
  SOURCE_META,
} from "@/lib/sources/types"
import { nbaCodeToId } from "@/lib/sources/nba-teams"

const BASE_URL = "https://stats.nba.com/stats"
const BR_BASE = "https://www.basketball-reference.com"

const NBA_HEADERS = {
  Referer: "https://www.nba.com/",
  Origin: "https://www.nba.com",
}

type NbaRow = Record<string, string | number | null>
type NbaResultSet = { name: string; headers: string[]; rowSet: (string | number | null)[][] }
type NbaEnvelope = { resultSets: NbaResultSet[] }

function readResultSet(payload: NbaEnvelope, name: string): NbaRow[] {
  const set = payload.resultSets.find((rs) => rs.name === name)
  if (!set) return []
  return set.rowSet.map((row) => {
    const obj: NbaRow = {}
    for (let i = 0; i < set.headers.length; i++) {
      obj[set.headers[i]!] = row[i] ?? null
    }
    return obj
  })
}

function photoUrl(playerId: number | string): string {
  return `https://cdn.nba.com/headshots/nba/latest/1040x760/${playerId}.png`
}

function teamLogoUrl(teamId: number | string): string {
  return `https://cdn.nba.com/logos/nba/${teamId}/global/L/logo.svg`
}

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "en-US,en;q=0.9",
    },
  })
  if (!res.ok) {
    throw new Error(`NBA BR upstream ${res.status} ${res.statusText} (${url})`)
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

function extractTableById(html: string, id: string): string {
  const re = new RegExp(`<table[^>]*\\bid="${id}"[\\s\\S]*?<\\/table>`, "i")
  const m = html.match(re)
  return m ? m[0] : ""
}

function rowsFromTable(tableHtml: string): string[] {
  if (!tableHtml) return []
  return tableHtml.match(/<tr\b[^>]*>[\s\S]*?<\/tr>/g) ?? []
}

function nbaSeasonYearEnd(): number {
  const code = SOURCE_META.nba.seasonCode
  const m = code.match(/(\d{4})-(\d{2})/)
  if (m) return 2000 + Number(m[2])
  return new Date().getFullYear()
}

const SEASON_END_YEAR = nbaSeasonYearEnd()

export const nbaAdapter: SourceAdapter = {
  id: "nba",
  displayName: SOURCE_META.nba.displayName,
  country: SOURCE_META.nba.country,
  season: SOURCE_META.nba.season,
  seasonCode: SOURCE_META.nba.seasonCode,

  async fetchTeams(): Promise<SourceTeam[]> {
    const season = SOURCE_META.nba.seasonCode
    const url = `${BASE_URL}/leaguestandingsv3?LeagueID=00&Season=${season}&SeasonType=Regular+Season`
    const payload = await fetchJson<NbaEnvelope>(url, { headers: NBA_HEADERS })
    const rows = readResultSet(payload, "Standings")
    const out: SourceTeam[] = []
    for (const r of rows) {
      const id = r.TeamID
      const city = r.TeamCity ? String(r.TeamCity) : ""
      const name = r.TeamName ? String(r.TeamName) : ""
      if (id == null || !name) continue
      out.push({
        sourceId: String(id),
        name: `${city} ${name}`.trim(),
        country: "USA",
        logoUrl: teamLogoUrl(id),
      })
    }
    return out
  },

  async fetchPlayers(): Promise<SourcePlayer[]> {
    const season = SOURCE_META.nba.seasonCode
    const url =
      `${BASE_URL}/leaguedashplayerbiostats?Season=${season}` +
      `&SeasonType=Regular+Season&LeagueID=00&PerMode=PerGame`
    const payload = await fetchJson<NbaEnvelope>(url, { headers: NBA_HEADERS })
    const rows = readResultSet(payload, "LeagueDashPlayerBioStats")
    const out: SourcePlayer[] = []
    for (const r of rows) {
      const id = r.PLAYER_ID
      const name = r.PLAYER_NAME
      if (id == null || !name) continue
      const heightInches = Number(r.PLAYER_HEIGHT_INCHES ?? 0)
      const weightLbs = Number(r.PLAYER_WEIGHT ?? 0)
      out.push({
        sourceId: String(id),
        fullName: String(name).trim(),
        nationality: r.COUNTRY ? String(r.COUNTRY) : undefined,
        age: r.AGE != null ? Number(r.AGE) : undefined,
        heightCm: heightInches > 0 ? Math.round(heightInches * 2.54) : undefined,
        weightKg: weightLbs > 0 ? Math.round(weightLbs * 0.453592) : undefined,
        teamSourceId: r.TEAM_ID ? String(r.TEAM_ID) : undefined,
        photoUrl: photoUrl(id),
      })
    }
    return out
  },

  async fetchStats(): Promise<SourceStats[]> {
    const season = SOURCE_META.nba.seasonCode
    const url =
      `${BASE_URL}/leaguegamelog?LeagueID=00&Season=${season}` +
      `&SeasonType=Regular+Season&PlayerOrTeam=P&Direction=ASC&Sorter=DATE` +
      `&DateFrom=&DateTo=&Counter=0`
    const payload = await fetchJson<NbaEnvelope>(url, { headers: NBA_HEADERS })
    const rows = readResultSet(payload, "LeagueGameLog")
    const accum = new Map<
      string,
      {
        playerId: string
        teamId: string | undefined
        games: number
        min: number
        pts: number
        reb: number
        ast: number
        stl: number
        blk: number
        tov: number
        fgm: number
        fga: number
        fg3m: number
        fg3a: number
        ftm: number
        fta: number
      }
    >()

    for (const r of rows) {
      const playerId = r.PLAYER_ID
      if (playerId == null) continue
      const key = String(playerId)
      const entry =
        accum.get(key) ??
        {
          playerId: key,
          teamId: r.TEAM_ID ? String(r.TEAM_ID) : undefined,
          games: 0,
          min: 0,
          pts: 0,
          reb: 0,
          ast: 0,
          stl: 0,
          blk: 0,
          tov: 0,
          fgm: 0,
          fga: 0,
          fg3m: 0,
          fg3a: 0,
          ftm: 0,
          fta: 0,
        }
      entry.games += 1
      entry.min += Number(r.MIN ?? 0) || 0
      entry.pts += Number(r.PTS ?? 0) || 0
      entry.reb += Number(r.REB ?? 0) || 0
      entry.ast += Number(r.AST ?? 0) || 0
      entry.stl += Number(r.STL ?? 0) || 0
      entry.blk += Number(r.BLK ?? 0) || 0
      entry.tov += Number(r.TOV ?? 0) || 0
      entry.fgm += Number(r.FGM ?? 0) || 0
      entry.fga += Number(r.FGA ?? 0) || 0
      entry.fg3m += Number(r.FG3M ?? 0) || 0
      entry.fg3a += Number(r.FG3A ?? 0) || 0
      entry.ftm += Number(r.FTM ?? 0) || 0
      entry.fta += Number(r.FTA ?? 0) || 0
      accum.set(key, entry)
    }

    const out: SourceStats[] = []
    for (const entry of accum.values()) {
      const g = entry.games
      const safeRatio = (num: number, den: number) =>
        den > 0 ? Number((num / den).toFixed(3)) : undefined
      out.push({
        playerSourceId: entry.playerId,
        season: SOURCE_META.nba.season,
        teamSourceId: entry.teamId,
        gamesPlayed: g,
        minutesPerGame: g > 0 ? Number((entry.min / g).toFixed(2)) : undefined,
        points: g > 0 ? Number((entry.pts / g).toFixed(2)) : undefined,
        rebounds: g > 0 ? Number((entry.reb / g).toFixed(2)) : undefined,
        assists: g > 0 ? Number((entry.ast / g).toFixed(2)) : undefined,
        steals: g > 0 ? Number((entry.stl / g).toFixed(2)) : undefined,
        blocks: g > 0 ? Number((entry.blk / g).toFixed(2)) : undefined,
        turnovers: g > 0 ? Number((entry.tov / g).toFixed(2)) : undefined,
        fgPct: safeRatio(entry.fgm, entry.fga),
        threePct: safeRatio(entry.fg3m, entry.fg3a),
        ftPct: safeRatio(entry.ftm, entry.fta),
      })
    }
    return out
  },

  async fetchCoaches(): Promise<SourceCoach[]> {
    const url = `${BR_BASE}/leagues/NBA_${SEASON_END_YEAR}_coaches.html`
    const html = await fetchHtml(url)
    const tableHtml = extractTableById(html, "NBA_coaches")
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
          /<a[^>]*href=(?:"|')(\/teams\/[^"']+\.html)(?:"|')/,
        )?.[1] ?? undefined
      const teamCode = teamHref?.match(/\/teams\/([^/]+)\//)?.[1]
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
        teamSourceId: teamCode ? nbaCodeToId(teamCode) : undefined,
      })
    }
    return out
  },

  async fetchTeamStats(): Promise<SourceTeamStats[]> {
    const url = `${BR_BASE}/leagues/NBA_${SEASON_END_YEAR}.html`
    const html = await fetchHtml(url)
    const out: SourceTeamStats[] = []
    const seen = new Set<string>()
    for (const id of ["divs_standings_E", "divs_standings_W"]) {
      const tableHtml = extractTableById(html, id)
      const rows = rowsFromTable(tableHtml)
      for (const row of rows) {
        const teamHref =
          row.match(
            /<a[^>]*href=(?:"|')(\/teams\/[^"']+\.html)(?:"|')/,
          )?.[1] ?? undefined
        const teamCode = teamHref?.match(/\/teams\/([^/]+)\//)?.[1]
        if (!teamCode) continue
        if (seen.has(teamCode)) continue
        const cells = getRowCells(row)
        const teamName = cells.get("team_name")
        if (!teamName) continue
        const g =
          (toNumberOrNull(cells.get("wins")) ?? 0) +
          (toNumberOrNull(cells.get("losses")) ?? 0)
        const w = toNumberOrNull(cells.get("wins")) ?? 0
        const l = toNumberOrNull(cells.get("losses")) ?? 0
        const pts = toNumberOrNull(cells.get("pts_per_g"))
        const oppPts = toNumberOrNull(cells.get("opp_pts_per_g"))
        const teamId = nbaCodeToId(teamCode)
        if (!teamId) continue
        seen.add(teamCode)
        out.push({
          teamSourceId: teamId,
          season: SOURCE_META.nba.season,
          gamesPlayed: g,
          wins: w,
          losses: l,
          winPct: g > 0 ? Number((w / g).toFixed(3)) : undefined,
          pointsFor: pts,
          pointsAgainst: oppPts,
        })
      }
    }
    return out
  },
}
