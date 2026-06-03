import {
  type SourceAdapter,
  type SourceCoach,
  type SourcePlayer,
  type SourceStats,
  type SourceTeam,
  type SourceTeamStats,
  SOURCE_META,
} from "@/lib/sources/types"
import { parseHeightToCm } from "@/lib/sync/slug"

const ACB_BASE = "https://www.acb.com"
const ACB_LIGA = "/es/liga"

const SEASON = SOURCE_META.acb.seasonCode
const SEASON_YEAR = SOURCE_META.acb.season

type Raw = Record<string, unknown>

function pickString(row: Raw, keys: string[]): string | undefined {
  for (const key of keys) {
    const v = row[key]
    if (typeof v === "string" && v.trim()) return v.trim()
    if (typeof v === "number") return String(v)
  }
  return undefined
}

function pickNumber(row: Raw, keys: string[]): number | undefined {
  for (const key of keys) {
    const v = row[key]
    if (typeof v === "number" && Number.isFinite(v)) return v
    if (typeof v === "string" && v.trim() !== "") {
      const n = Number(v)
      if (Number.isFinite(n)) return n
    }
  }
  return undefined
}

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
    },
  })
  if (!res.ok) {
    throw new Error(`ACB upstream ${res.status} ${res.statusText} (${url})`)
  }
  return res.text()
}

function unescapeJsonString(s: string): string {
  let out = ""
  for (let i = 0; i < s.length; i++) {
    const ch = s[i]
    if (ch !== "\\") {
      out += ch
      continue
    }
    const next = s[i + 1]
    if (next === undefined) {
      out += ch
      continue
    }
    if (next === "u") {
      const hex = s.slice(i + 2, i + 6)
      if (/^[0-9A-Fa-f]{4}$/.test(hex)) {
        out += String.fromCharCode(parseInt(hex, 16))
        i += 5
        continue
      }
    }
    if (next === '"') out += '"'
    else if (next === "\\") out += "\\"
    else if (next === "/") out += "/"
    else if (next === "b") out += "\b"
    else if (next === "f") out += "\f"
    else if (next === "n") out += "\n"
    else if (next === "r") out += "\r"
    else if (next === "t") out += "\t"
    else out += next
    i++
  }
  return out
}

function getRscPayload(html: string): string {
  const re = /self\.__next_f\.push\(\[\s*1\s*,\s*"((?:[^"\\]|\\.)*)"\s*\]\)/g
  const chunks: string[] = []
  let m: RegExpExecArray | null
  while ((m = re.exec(html)) !== null) chunks.push(unescapeJsonString(m[1] ?? ""))
  return chunks.join("")
}

function findBalancedObject(rsc: string, start: number): { start: number; end: number } | null {
  let i = start
  while (i < rsc.length && /\s/.test(rsc[i] ?? "")) i++
  if (rsc[i] !== "{") return null
  let depth = 0
  let inStr = false
  let escape = false
  for (let k = i; k < rsc.length; k++) {
    const c = rsc[k]
    if (inStr) {
      if (escape) escape = false
      else if (c === "\\") escape = true
      else if (c === '"') inStr = false
      continue
    }
    if (c === '"') inStr = true
    else if (c === "{") depth++
    else if (c === "}") {
      depth--
      if (depth === 0) return { start: i, end: k }
    }
  }
  return null
}

function findBalancedArray(rsc: string, start: number): { start: number; end: number } | null {
  let i = start
  while (i < rsc.length && /\s/.test(rsc[i] ?? "")) i++
  if (rsc[i] !== "[") return null
  let depth = 0
  let inStr = false
  let escape = false
  for (let k = i; k < rsc.length; k++) {
    const c = rsc[k]
    if (inStr) {
      if (escape) escape = false
      else if (c === "\\") escape = true
      else if (c === '"') inStr = false
      continue
    }
    if (c === '"') inStr = true
    else if (c === "[") depth++
    else if (c === "]") {
      depth--
      if (depth === 0) return { start: i, end: k }
    }
  }
  return null
}

function extractRscObject(rsc: string, key: string): Raw | null {
  const marker = `"${key}":`
  const idx = rsc.indexOf(marker)
  if (idx < 0) return null
  const span = findBalancedObject(rsc, idx + marker.length)
  if (!span) return null
  const text = rsc.slice(span.start, span.end + 1)
  try {
    return JSON.parse(text) as Raw
  } catch {
    return null
  }
}

function extractRscArray(rsc: string, key: string): Raw[] {
  const marker = `"${key}":`
  const idx = rsc.indexOf(marker)
  if (idx < 0) return []
  const span = findBalancedArray(rsc, idx + marker.length)
  if (!span) return []
  const text = rsc.slice(span.start, span.end + 1)
  try {
    return JSON.parse(text) as Raw[]
  } catch {
    return []
  }
}

function unwrapTeam(t: Raw): Raw {
  if (t && typeof t === "object" && (t.latest || t.selected)) {
    return ((t.latest ?? t.selected) as Raw) ?? t
  }
  return t
}

type AcbTeam = {
  sourceId: string
  name: string
  shortName: string
  abbreviation: string
  clubId: number
  logoUrl?: string
  primaryColor?: string
}

type AcbClubInfo = {
  team?: {
    id: number
    clubId: number
    fullName: string
    shortName: string
    abbreviatedName: string
    logo: string
    primaryColorHex: string
  }
  stadiumName?: string
  stadiumAddress?: string
  stadiumCapacity?: number
  foundationYear?: number
  webUrl?: string
  city?: string
}

async function fetchTeamsList(): Promise<AcbTeam[]> {
  const html = await fetchHtml(`${ACB_BASE}${ACB_LIGA}/equipos`)
  const rsc = getRscPayload(html)
  const teamsRaw = extractRscArray(rsc, "teams")
  const out: AcbTeam[] = []
  for (const t of teamsRaw) {
    const u = unwrapTeam(t)
    const clubId = Number(u.clubId ?? 0)
    if (!clubId) continue
    out.push({
      sourceId: `acb-${clubId}`,
      name: pickString(u, ["fullName"]) ?? "",
      shortName: pickString(u, ["shortName"]) ?? "",
      abbreviation: pickString(u, ["abbreviatedName"]) ?? "",
      clubId,
      logoUrl: pickString(u, ["logo"]) ?? undefined,
      primaryColor: pickString(u, ["primaryColorHex"]) ?? undefined,
    })
  }
  return out
}

const slugCache = new Map<number, string>()
async function resolveSlug(clubId: number, teams?: AcbTeam[]): Promise<string> {
  if (slugCache.has(clubId)) return slugCache.get(clubId)!
  const list = teams ?? (await fetchTeamsList())
  const t = list.find((x) => x.clubId === clubId)
  if (!t) return `club-${clubId}`
  const m = t.name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
  const slug = `${m}-${clubId}`
  slugCache.set(clubId, slug)
  return slug
}

async function fetchRoster(clubId: number): Promise<{
  players: Raw[]
  staff: Raw[]
  clubInfo: AcbClubInfo | null
}> {
  const slug = await resolveSlug(clubId)
  const html = await fetchHtml(`${ACB_BASE}${ACB_LIGA}/equipos/${slug}/plantilla`)
  const rsc = getRscPayload(html)
  const roster = extractRscObject(rsc, "currentRoster")
  const players = Array.isArray(roster?.players) ? (roster.players as Raw[]) : []
  const staff = Array.isArray(roster?.staff) ? (roster.staff as Raw[]) : []
  const clubInfo = extractRscObject(rsc, "clubInfo") as AcbClubInfo | null
  return { players, staff, clubInfo }
}

function mapPlayer(raw: Raw, teamSourceId: string): SourcePlayer | null {
  const player = raw.player
  if (!player || typeof player !== "object") return null
  const p = player as Raw
  const id = pickString(p, ["id"])
  const firstName = pickString(p, ["firstName"]) ?? ""
  const lastName = pickString(p, ["lastName"]) ?? ""
  const fullName = `${firstName} ${lastName}`.trim()
  if (!id || !fullName) return null
  const height = pickNumber(raw, ["height"])
  return {
    sourceId: `acb-${id}`,
    fullName,
    nationality: pickString(raw, ["nationalityCountry"]) ?? undefined,
    position: pickString(p, ["gameRole"]) ?? undefined,
    jerseyNumber: pickString(p, ["shirtNumber"]) ?? undefined,
    age: pickNumber(raw, ["age"]),
    heightCm: typeof height === "number" ? height : parseHeightToCm(String(height)),
    teamSourceId,
    photoUrl:
      pickString(p, ["headshotImageNoBackgroundUrl", "headshotImageUrl"]) ??
      undefined,
    licenseType: pickString(raw, ["licensing"]) ?? undefined,
  }
}

function mapCoach(raw: Raw, teamSourceId: string): SourceCoach | null {
  const coach = raw.coach
  if (!coach || typeof coach !== "object") return null
  const c = coach as Raw
  const id = pickString(c, ["id"])
  const firstName = pickString(c, ["firstName"]) ?? ""
  const lastName = pickString(c, ["lastName"]) ?? ""
  const fullName = `${firstName} ${lastName}`.trim()
  if (!id || !fullName) return null
  const role = pickString(c, ["gameRole"]) ?? ""
  const roleLower = role.toLowerCase()
  const normalized: SourceCoach["role"] = roleLower.includes("ayudante")
    ? "assistant_coach"
    : roleLower.includes("preparador") ||
        roleLower.includes("físic") ||
        roleLower.includes("fisio") ||
        roleLower.includes("delegad")
      ? "staff"
      : "head_coach"
  return {
    sourceId: `acb-${id}`,
    fullName,
    role: normalized,
    teamSourceId,
    nationality: pickString(raw, ["nationalityCountry"]) ?? undefined,
    age: pickNumber(raw, ["age"]),
    photoUrl:
      pickString(c, ["headshotImageNoBackgroundUrl", "headshotImageUrl"]) ??
      undefined,
    licenseType: pickString(raw, ["licensing"]) ?? undefined,
  }
}

type Roster = {
  players: SourcePlayer[]
  coaches: SourceCoach[]
  details: { city?: string; foundedYear?: number; arena?: string; arenaCapacity?: number; websiteUrl?: string }
  stats: { position?: number; wins?: number; losses?: number; pointsFor?: number; pointsAgainst?: number }
}

async function fetchTeamStatsHtml(
  clubId: number,
): Promise<Roster["stats"]> {
  const slug = await resolveSlug(clubId)
  try {
    const html = await fetchHtml(`${ACB_BASE}${ACB_LIGA}/equipos/${slug}`)
    const out: Roster["stats"] = {}
    const re =
      /__label"[^>]*>([^<]+)<\/span>[\s\S]{0,400}?__resumenStandingsFieldValue[^>]*>\s*(\d[\d.,]*)/g
    let m: RegExpExecArray | null
    while ((m = re.exec(html)) !== null) {
      const label = m[1].trim()
      const numStr = m[2].replace(/\./g, "").replace(",", ".")
      const n = Number(numStr)
      if (!Number.isFinite(n)) continue
      if (label.startsWith("Posición")) out.position = Math.round(n)
      else if (label === "Victorias") out.wins = Math.round(n)
      else if (label === "Derrotas") out.losses = Math.round(n)
      else if (label === "Puntos a favor") out.pointsFor = n
      else if (label === "Puntos en contra") out.pointsAgainst = n
    }
    return out
  } catch {
    return {}
  }
}

async function fetchAllRosters(
  teams: AcbTeam[],
): Promise<Map<string, Roster>> {
  const out = new Map<string, Roster>()
  for (const t of teams) {
    try {
      const r = await fetchRoster(t.clubId)
      const players: SourcePlayer[] = []
      for (const p of r.players) {
        const m = mapPlayer(p, t.sourceId)
        if (m) players.push(m)
      }
      const coaches: SourceCoach[] = []
      for (const c of r.staff) {
        const m = mapCoach(c, t.sourceId)
        if (m) coaches.push(m)
      }
      const ci = r.clubInfo
      const details: Roster["details"] = {
        city: ci?.city ?? ci?.stadiumAddress,
        foundedYear: ci?.foundationYear,
        arena: ci?.stadiumName,
        arenaCapacity: ci?.stadiumCapacity,
        websiteUrl: ci?.webUrl,
      }
      const stats = await fetchTeamStatsHtml(t.clubId)
      out.set(t.sourceId, { players, coaches, details, stats })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.warn(`[acb] failed team ${t.sourceId}: ${message}`)
      out.set(t.sourceId, { players: [], coaches: [], details: {}, stats: {} })
    }
  }
  return out
}

export const acbAdapter: SourceAdapter = {
  id: "acb",
  displayName: SOURCE_META.acb.displayName,
  country: SOURCE_META.acb.country,
  season: SEASON_YEAR,
  seasonCode: SEASON,

  async fetchTeams(): Promise<SourceTeam[]> {
    const teams = await fetchTeamsList()
    const data = await fetchAllRosters(teams)
    return teams.map((t) => {
      const r = data.get(t.sourceId)
      return {
        sourceId: t.sourceId,
        name: t.name,
        shortName: t.shortName,
        country: "ES",
        logoUrl: t.logoUrl,
        primaryColor: t.primaryColor,
        city: r?.details.city,
        foundedYear: r?.details.foundedYear,
        arena: r?.details.arena,
        arenaCapacity: r?.details.arenaCapacity,
        websiteUrl: r?.details.websiteUrl,
      }
    })
  },

  async fetchPlayers(): Promise<SourcePlayer[]> {
    const teams = await fetchTeamsList()
    const data = await fetchAllRosters(teams)
    const all: SourcePlayer[] = []
    for (const r of data.values()) all.push(...r.players)
    return all
  },

  async fetchCoaches(): Promise<SourceCoach[]> {
    const teams = await fetchTeamsList()
    const data = await fetchAllRosters(teams)
    const all: SourceCoach[] = []
    for (const r of data.values()) all.push(...r.coaches)
    return all
  },

  async fetchTeamStats(): Promise<SourceTeamStats[]> {
    const teams = await fetchTeamsList()
    const data = await fetchAllRosters(teams)
    const out: SourceTeamStats[] = []
    for (const t of teams) {
      const r = data.get(t.sourceId)
      if (!r?.stats) continue
      const { wins = 0, losses = 0, pointsFor, pointsAgainst, position } = r.stats
      const gp = wins + losses
      if (gp === 0 && position == null) continue
      out.push({
        teamSourceId: t.sourceId,
        season: SEASON_YEAR,
        gamesPlayed: gp,
        wins,
        losses,
        winPct: gp > 0 ? Number((wins / gp).toFixed(3)) : undefined,
        pointsFor: pointsFor != null ? Number((pointsFor / gp).toFixed(1)) : undefined,
        pointsAgainst:
          pointsAgainst != null ? Number((pointsAgainst / gp).toFixed(1)) : undefined,
        position,
      })
    }
    return out
  },

  async fetchStats(): Promise<SourceStats[]> {
    const brYear = SEASON.endsWith("-25")
      ? "2025"
      : SEASON.endsWith("-24")
        ? "2024"
        : SEASON.endsWith("-26")
          ? "2026"
          : SEASON
    const brUrl = `https://www.basketball-reference.com/international/spain-liga-acb/${brYear}_per_game.html`
    const brHtml = await fetchHtml(brUrl)
    const brRe = new RegExp(
      `<table[^>]*\\bid="per_game-stats-${brYear}"[\\s\\S]*?<\\/table>`,
      "i",
    )
    const brTableMatch = brHtml.match(brRe)
    if (!brTableMatch) return []
    const brRows = brTableMatch[0].match(/<tr\b[^>]*>[\s\S]*?<\/tr>/g) ?? []

    const acbPlayers = await this.fetchPlayers()
    const nameToAcbId = new Map<string, string>()
    for (const p of acbPlayers) {
      nameToAcbId.set(normalizeName(p.fullName), p.sourceId)
    }
    const teams = await fetchTeamsList()
    const teamNameToId = new Map<string, string>()
    for (const t of teams) teamNameToId.set(t.name.toLowerCase(), t.sourceId)

    const out: SourceStats[] = []
    for (const row of brRows) {
      const cells = new Map<string, string>()
      const cellRe =
        /<t[hd]\b[^>]*\bdata-stat="([^"]+)"[^>]*>([\s\S]*?)<\/t[hd]>/g
      let cm: RegExpExecArray | null
      while ((cm = cellRe.exec(row)) !== null) {
        cells.set(cm[1], cm[2].replace(/<[^>]+>/g, "").trim())
      }
      const playerName = cells.get("player")
      if (!playerName) continue
      const acbId = nameToAcbId.get(normalizeName(playerName))
      if (!acbId) continue
      const teamName = cells.get("team_name")?.replace(/\*+$/, "").trim()
      const teamSourceId = teamName
        ? teamNameToId.get(teamName.toLowerCase())
        : undefined
      out.push({
        playerSourceId: acbId,
        season: SEASON_YEAR,
        teamSourceId,
        gamesPlayed: Number(cells.get("g")) || 0,
        minutesPerGame: Number(cells.get("mp_per_g")) || undefined,
        points: Number(cells.get("pts_per_g")) || undefined,
        rebounds: Number(cells.get("trb_per_g")) || undefined,
        assists: Number(cells.get("ast_per_g")) || undefined,
        steals: Number(cells.get("stl_per_g")) || undefined,
        blocks: Number(cells.get("blk_per_g")) || undefined,
        turnovers: Number(cells.get("tov_per_g")) || undefined,
        fgPct: cells.get("fg_pct")
          ? Number((Number(cells.get("fg_pct")) / 100).toFixed(3))
          : undefined,
        threePct: cells.get("fg3_pct")
          ? Number((Number(cells.get("fg3_pct")) / 100).toFixed(3))
          : undefined,
        ftPct: cells.get("ft_pct")
          ? Number((Number(cells.get("ft_pct")) / 100).toFixed(3))
          : undefined,
      })
    }
    return out
  },
}

function normalizeName(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}
