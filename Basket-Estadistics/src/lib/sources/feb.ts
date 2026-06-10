import {
  type SourceAdapter,
  type SourceCoach,
  type SourcePlayer,
  type SourceTeam,
  type SourceTeamStats,
  type ExtractedPlayerStat,
} from "@/lib/sources/types"
import { parseHeightToCm } from "@/lib/sync/slug"

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
const BASE = "https://baloncestoenvivo.feb.es"
const SEASON_YEAR = 2025
const SEASON_T = "2025"

export type FebConfig = {
  id: "leb-oro" | "leb-plata" | "eba"
  displayName: string
  g: number
  nm: string
}

type Hiddens = Record<string, string>
type Select = {
  name: string
  options: Array<{ value: string; text: string; selected: boolean }>
}

async function fetchText(url: string, init?: { method?: string; body?: string }): Promise<string> {
  const res = await fetch(url, {
    method: init?.method ?? "GET",
    body: init?.body,
    headers: {
      "User-Agent": UA,
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "es-ES,es;q=0.9",
      ...(init?.body ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
    },
  })
  if (!res.ok) throw new Error(`FEB ${res.status} ${res.statusText} (${url})`)
  return res.text()
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&").replace(/&aacute;/g, "á").replace(/&eacute;/g, "é")
    .replace(/&iacute;/g, "í").replace(/&oacute;/g, "ó").replace(/&uacute;/g, "ú")
    .replace(/&ntilde;/g, "ñ").replace(/&Ntilde;/g, "Ñ").replace(/&uuml;/g, "ü")
    .replace(/&nbsp;/g, " ").replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
}

function parseHiddens(html: string): Hiddens {
  const out: Hiddens = {}
  for (const tag of html.match(/<input[^>]*type="hidden"[^>]*>/gi) ?? []) {
    const name = tag.match(/name="([^"]+)"/)?.[1]
    const value = tag.match(/value="([^"]*)"/)?.[1] ?? ""
    if (name) out[name] = decodeEntities(value)
  }
  return out
}

function parseSelects(html: string): Select[] {
  const out: Select[] = []
  const re = /<select[^>]*\bname="([^"]+)"[^>]*>([\s\S]*?)<\/select>/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(html)) !== null) {
    const options: Select["options"] = []
    const ore = /<option([^>]*)>([\s\S]*?)<\/option>/gi
    let om: RegExpExecArray | null
    while ((om = ore.exec(m[2]!)) !== null) {
      options.push({
        value: om[1]!.match(/value="([^"]*)"/)?.[1] ?? "",
        text: decodeEntities(om[2]!.replace(/<[^>]+>/g, "").trim()),
        selected: /\bselected\b/i.test(om[1]!),
      })
    }
    out.push({ name: m[1]!, options })
  }
  return out
}

function findSelect(selects: Select[], predicate: (s: Select) => boolean) {
  return selects.find(predicate)
}

const isTeamOption = (value: string) => /^\d+$/.test(value) && Number(value) > 100000

function teamSelect(selects: Select[]) {
  return findSelect(
    selects,
    (s) => s.options.some((o) => o.value === "-1" && /equipo/i.test(o.text)) &&
      s.options.some((o) => isTeamOption(o.value)),
  )
}

function regularPhase(selects: Select[]): { name: string; value: string } | undefined {
  for (const s of selects) {
    const opt = s.options.find((o) => /regular/i.test(o.text) && /^-?\d+$/.test(o.value))
    if (opt) return { name: s.name, value: opt.value }
  }
  return undefined
}

function buildPostBody(hiddens: Hiddens, selects: Select[], eventTarget: string, overrides: Record<string, string>): string {
  const body = new URLSearchParams()
  for (const [k, v] of Object.entries(hiddens)) body.set(k, v)
  for (const s of selects) {
    const selected = s.options.find((o) => o.selected) ?? s.options[0]
    body.set(s.name, selected?.value ?? "")
  }
  for (const [k, v] of Object.entries(overrides)) body.set(k, v)
  body.set("__EVENTTARGET", eventTarget)
  body.set("__EVENTARGUMENT", "")
  return body.toString()
}

function toNum(s: string | undefined): number | undefined {
  if (!s) return undefined
  const n = Number(s.replace(/\./g, "").replace(",", "."))
  return Number.isFinite(n) ? n : undefined
}

function titleCaseEs(s: string): string {
  return s.toLowerCase().replace(/(^|[\s'-])([\p{L}])/gu, (_, sep, ch) => sep + ch.toUpperCase())
}

function formatFebName(raw: string): string {
  const clean = decodeEntities(raw.replace(/<[^>]+>/g, "").trim())
  const parts = clean.split(",")
  const reordered = parts.length >= 2 ? `${parts[1]!.trim()} ${parts[0]!.trim()}` : clean
  return titleCaseEs(reordered.replace(/\s+/g, " ").trim())
}

function tdText(row: string, cls: string): string | undefined {
  const m = row.match(new RegExp(`class="${cls}"[^>]*>([\\s\\S]*?)</td>`, "i"))
  if (!m) return undefined
  return decodeEntities(m[1]!.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim() || undefined
}

type FebPlayer = {
  playerId: string; fullName: string; teamId: string; teamName: string
  position?: string; heightCm?: number; nationality?: string; games?: number; ppg?: number
}

function parseRoster(html: string, teamId: string, teamName: string): FebPlayer[] {
  const out: FebPlayer[] = []
  for (const rm of html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const row = rm[1]!
    const nameM = row.match(
      /class="nombre jugador"[\s\S]*?Jugador\.aspx\?i=\d+&(?:amp;)?c=(\d+)[^>]*>\s*([^<]+?)\s*<\/a>/i,
    )
    if (!nameM) continue
    const fullName = formatFebName(nameM[2]!)
    if (!fullName) continue
    out.push({
      playerId: nameM[1]!, fullName, teamId, teamName,
      position: tdText(row, "puesto"),
      heightCm: tdText(row, "altura") ? parseHeightToCm(tdText(row, "altura")!) : undefined,
      nationality: tdText(row, "nacionalidad"),
      games: toNum(row.match(/class="partidos"[\s\S]*?<span[^>]*>\s*([\d.,]+)/i)?.[1]),
      ppg: toNum(row.match(/class="media"[\s\S]*?<span[^>]*>\s*([\d.,]+)/i)?.[1]),
    })
  }
  return out
}

type PointLine = { games: number; ppg: number | undefined }

function parsePointsRanking(html: string): Map<string, PointLine> {
  const out = new Map<string, PointLine>()
  for (const rm of html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const row = rm[1]!
    const nameM = row.match(/class="nombre jugador"[\s\S]*?Jugador\.aspx\?i=\d+&(?:amp;)?c=(\d+)/i)
    if (!nameM) continue
    const games = toNum(row.match(/class="partidos"[\s\S]*?<span[^>]*>\s*([\d.,]+)/i)?.[1])
    const ppg = toNum(row.match(/class="media"[\s\S]*?<span[^>]*>\s*([\d.,]+)/i)?.[1])
    if (games && games > 0) out.set(nameM[1]!, { games, ppg })
  }
  return out
}

type FebData = { players: FebPlayer[]; points: Map<string, PointLine> }

async function collectData(cfg: FebConfig): Promise<FebData> {
  const url = `${BASE}/rankings.aspx?g=${cfg.g}&t=${SEASON_T}&nm=${cfg.nm}`
  const firstHtml = await fetchText(url)
  let hiddens = parseHiddens(firstHtml)
  let selects = parseSelects(firstHtml)
  const phase = regularPhase(selects)
  let regHtml = firstHtml
  if (phase) {
    regHtml = await fetchText(url, {
      method: "POST",
      body: buildPostBody(hiddens, selects, phase.name, { [phase.name]: phase.value }),
    })
    hiddens = parseHiddens(regHtml)
    selects = parseSelects(regHtml)
  }
  const points = parsePointsRanking(regHtml)
  const teams = teamSelect(selects)
  const teamOptions = (teams?.options ?? []).filter((o) => isTeamOption(o.value))
  if (!teams || teamOptions.length === 0) return { players: [], points }
  const phaseAfter = regularPhase(selects)
  const byPlayer = new Map<string, FebPlayer>()
  for (const opt of teamOptions) {
    try {
      const overrides: Record<string, string> = { [teams.name]: opt.value }
      if (phaseAfter) overrides[phaseAfter.name] = phaseAfter.value
      const html = await fetchText(url, {
        method: "POST",
        body: buildPostBody(hiddens, selects, teams.name, overrides),
      })
      for (const p of parseRoster(html, opt.value, opt.text)) byPlayer.set(p.playerId, p)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.warn(`[feb:${cfg.id}] team ${opt.value} failed: ${msg}`)
    }
  }
  return { players: [...byPlayer.values()], points }
}

export function createFebAdapter(cfg: FebConfig): SourceAdapter {
  let cache: FebData | null = null
  const data = async () => (cache ??= await collectData(cfg))

  return {
    id: cfg.id,
    displayName: cfg.displayName,
    country: "ES",
    season: SEASON_YEAR,
    seasonCode: `${SEASON_YEAR}-${String(SEASON_YEAR + 1).slice(-2)}`,

    async fetchTeams(): Promise<SourceTeam[]> {
      const seen = new Map<string, SourceTeam>()
      for (const p of (await data()).players) {
        if (p.teamId && p.teamName && !seen.has(p.teamId))
          seen.set(p.teamId, { sourceId: `feb-${p.teamId}`, name: p.teamName, country: "ES" })
      }
      return [...seen.values()]
    },

    async fetchPlayers(): Promise<SourcePlayer[]> {
      return (await data()).players.map((p) => ({
        sourceId: `feb-${p.playerId}`, fullName: p.fullName, position: p.position,
        heightCm: p.heightCm, nationality: p.nationality,
        teamSourceId: p.teamId ? `feb-${p.teamId}` : undefined,
        // The c= license id in Jugador.aspx links doubles as the photo key.
        photoUrl: `https://imagenes.feb.es/Foto.aspx?c=${p.playerId}`,
      }))
    },

    async fetchStats(): Promise<ExtractedPlayerStat[]> {
      const { players, points } = await data()
      const out: ExtractedPlayerStat[] = []
      for (const p of players) {
        const games = p.games ?? points.get(p.playerId)?.games
        const ppg = p.ppg ?? points.get(p.playerId)?.ppg
        if (!games || games <= 0) continue
        out.push({
          playerSourceId: `feb-${p.playerId}`,
          season: SEASON_YEAR,
          teamSourceId: p.teamId ? `feb-${p.teamId}` : undefined,
          gamesPlayed: games,
          pointsTotal: ppg != null ? Math.round(ppg * games) : null,
          minutesTotal: null, reboundsTotal: null, assistsTotal: null,
          stealsTotal: null, blocksTotal: null, turnoversTotal: null,
          fgMade: null, fgAttempted: null, threeMade: null, threeAttempted: null,
          ftMade: null, ftAttempted: null, offensiveRebounds: null, defensiveRebounds: null,
          foulsTotal: null, plusMinus: null, per: null, trueShootingPct: null,
          winShares: null, bpm: null,
        })
      }
      return out
    },

    async fetchCoaches(): Promise<SourceCoach[]> { return [] },
    async fetchTeamStats(): Promise<SourceTeamStats[]> { return [] },
  }
}

export const FEB_CONFIGS: FebConfig[] = [
  { id: "leb-oro", displayName: "LEB Oro", g: 1, nm: "primerafeb" },
  { id: "leb-plata", displayName: "LEB Plata", g: 2, nm: "segundafeb" },
  { id: "eba", displayName: "Liga EBA", g: 3, nm: "tercerafeb" },
]

export const febAdapters = FEB_CONFIGS.map(createFebAdapter)
