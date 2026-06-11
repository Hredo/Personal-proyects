import { and, asc, desc, eq, ilike, like, sql } from "drizzle-orm"
import { getDb } from "@/lib/db/client"
import {
  leagues,
  playerSeasonStats,
  players,
  seasons,
  teams,
} from "@/lib/db/schema"
import { cached } from "@/lib/data/cache"
import { leagueSlugsFor } from "@/lib/league-groups"

export type PlayerListItem = {
  id: string
  fullName: string
  slug: string
  nationality: string | null
  position: string | null
  heightCm: number | null
  weightKg: number | null
  imageUrl: string | null
  league: { id: string; name: string; slug: string; region: string }
  team: { id: string; name: string; slug: string; logoUrl: string | null } | null
  stats: {
    seasonId: string
    seasonName: string
    gamesPlayed: number
    pointsTotal: number | null
    reboundsTotal: number | null
    assistsTotal: number | null
    stealsTotal: number | null
    blocksTotal: number | null
    turnoversTotal: number | null
    per: number | null
  } | null
}

export type ListPlayersInput = {
  query?: string
  league?: string
  team?: string
  sort?: "points" | "rebounds" | "assists" | "name"
  order?: "asc" | "desc"
  page?: number
  pageSize?: number
}

export type ListPlayersResult = {
  items: PlayerListItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export async function listPlayers(
  input: ListPlayersInput = {},
): Promise<ListPlayersResult> {
  const db = getDb()
  const page = Math.max(1, input.page ?? 1)
  const pageSize = Math.max(1, Math.min(input.pageSize ?? 24, 200))
  const order = input.order ?? "desc"
  const sort = input.sort ?? "points"
  const offset = (page - 1) * pageSize

  const sortColumn = (() => {
    switch (sort) {
      case "rebounds":
        return sql`coalesce(rebounds_total, 0)`
      case "assists":
        return sql`coalesce(assists_total, 0)`
      case "name":
        return sql`lower(p_full_name)`
      case "points":
      default:
        return sql`coalesce(points_total, 0)`
    }
  })()
  const orderDir = order === "asc" ? sql`asc` : sql`desc`

  const teamFilter = input.team
    ? sql`lower(coalesce(t.name, '')) like ${`%${input.team.toLowerCase()}%`}`
    : sql`1=1`
  const queryFilter = input.query
    ? sql`lower(p.first_name || ' ' || p.last_name) like ${`%${input.query.toLowerCase()}%`}`
    : sql`1=1`
  const leagueSlugs = leagueSlugsFor(input.league)
  const leagueFilter = leagueSlugs
    ? sql`l.slug in (${sql.join(leagueSlugs.map((s) => sql`${s}`), sql`, `)})`
    : sql`1=1`

  const fullSql = sql`
    with memberships as (
      select
        pss.player_id,
        pss.league_id,
        pss.season_id,
        s.name as season_name,
        pss.team_id,
        pss.games_played,
        pss.points_total,
        pss.rebounds_total,
        pss.assists_total,
        pss.steals_total,
        pss.blocks_total,
        pss.turnovers_total,
        pss.per
      from ${playerSeasonStats} pss
      inner join ${seasons} s on s.id = pss.season_id
    ),
    ranked as (
      select
        m.*,
        p.id as p_id,
        p.first_name || ' ' || p.last_name as p_full_name,
        p.slug as p_slug,
        p.nationality as p_nationality,
        p.position as p_position,
        p.height_cm as p_height_cm,
        p.weight_kg as p_weight_kg,
        p.image_url as p_image_url,
        l.id as l_id,
        l.name as l_name,
        l.slug as l_slug,
        l.region as l_region,
        t.id as t_id,
        t.name as t_name,
        t.slug as t_slug,
        t.logo_url as t_logo_url,
        row_number() over (
          partition by lower(p.first_name || ' ' || p.last_name)
          order by coalesce(m.games_played, 0) desc
        ) as rn
      from memberships m
      inner join ${players} p on p.id = m.player_id
      inner join ${leagues} l on l.id = m.league_id
      left join ${teams} t on t.id = m.team_id
      where ${leagueFilter} and ${teamFilter} and ${queryFilter}
    )
    select
      p_id as player_id,
      p_full_name as full_name,
      p_slug as slug,
      p_nationality as nationality,
      p_position as position,
      p_height_cm as height_cm,
      p_weight_kg as weight_kg,
      p_image_url as image_url,
      l_id as league_id,
      l_name as league_name,
      l_slug as league_slug,
      l_region as league_region,
      t_id as team_id,
      t_name as team_name,
      t_slug as team_slug,
      t_logo_url as team_logo,
      season_id,
      season_name,
      games_played,
      points_total,
      rebounds_total,
      assists_total,
      steals_total,
      blocks_total,
      turnovers_total,
      per
    from ranked
    where rn = 1
    order by ${sortColumn} ${orderDir}, p_full_name ${orderDir}
    limit ${pageSize} offset ${offset}
  `

  const countSql = sql`
    with memberships as (
      select pss.player_id, pss.league_id, pss.season_id, pss.team_id, pss.games_played
      from ${playerSeasonStats} pss
      inner join ${seasons} s on s.id = pss.season_id
    ),
    ranked as (
      select
        p.id as p_id,
        lower(p.first_name || ' ' || p.last_name) as p_lower_name,
        p.image_url as p_image_url,
        p.nationality as p_nationality,
        p.position as p_position,
        m.games_played as m_games_played,
        row_number() over (
          partition by lower(p.first_name || ' ' || p.last_name)
          order by coalesce(m.games_played, 0) desc
        ) as rn
      from memberships m
      inner join ${players} p on p.id = m.player_id
      inner join ${leagues} l on l.id = m.league_id
      left join ${teams} t on t.id = m.team_id
      where ${leagueFilter} and ${teamFilter} and ${queryFilter}
    )
    select count(*) as c from ranked where rn = 1
  `

  try {
    const [countRow] = (await db.execute(countSql)) as Array<{ c: number | string }>
    const total = Number(countRow?.c ?? 0)

    const rawRows = (await db.execute(fullSql)) as Array<{
      player_id: string
      full_name: string
      slug: string
      nationality: string | null
      position: string | null
      height_cm: number | null
      weight_kg: number | null
      image_url: string | null
      league_id: string
      league_name: string
      league_slug: string
      league_region: string
      team_id: string | null
      team_name: string | null
      team_slug: string | null
      team_logo: string | null
      season_id: string | null
      season_name: string | null
      games_played: number | null
      points_total: number | null
      rebounds_total: number | null
      assists_total: number | null
      steals_total: number | null
      blocks_total: number | null
      turnovers_total: number | null
      per: number | null
    }>

    const totalPages = Math.max(1, Math.ceil(total / pageSize))

    return {
      items: rawRows.map((r) => ({
        id: r.player_id,
        fullName: r.full_name,
        slug: r.slug,
        nationality: r.nationality,
        position: r.position,
        heightCm: r.height_cm,
        weightKg: r.weight_kg,
        imageUrl: r.image_url,
        league: {
          id: r.league_id,
          name: r.league_name,
          slug: r.league_slug,
          region: r.league_region,
        },
        team:
          r.team_id && r.team_name && r.team_slug
            ? {
                id: r.team_id,
                name: r.team_name,
                slug: r.team_slug,
                logoUrl: r.team_logo,
              }
            : null,
        stats:
          r.games_played == null
            ? null
            : {
                seasonId: r.season_id!,
                seasonName: r.season_name ?? "",
                gamesPlayed: r.games_played,
                pointsTotal: r.points_total,
                reboundsTotal: r.rebounds_total,
                assistsTotal: r.assists_total,
                stealsTotal: r.steals_total,
                blocksTotal: r.blocks_total,
                turnoversTotal: r.turnovers_total,
                per: r.per,
              },
      })),
      total,
      page,
      pageSize,
      totalPages,
    }
  } catch (error) {
    console.warn("[listPlayers] falling back to empty result", error)
    return {
      items: [],
      total: 0,
      page,
      pageSize,
      totalPages: 1,
    }
  }
}

export type PlayerProfile = {
  id: string
  fullName: string
  slug: string
  nationality: string | null
  position: string | null
  heightCm: number | null
  weightKg: number | null
  imageUrl: string | null
  league: { id: string; name: string; slug: string; region: string }
  team: { id: string; name: string; slug: string; logoUrl: string | null } | null
  seasons: Array<{
    seasonId: string
    seasonName: string
    gamesPlayed: number
    pointsTotal: number | null
    reboundsTotal: number | null
    assistsTotal: number | null
    stealsTotal: number | null
    blocksTotal: number | null
    turnoversTotal: number | null
    per: number | null
  }>
}

export const getPlayerBySlug = cached(
  async (slug: string): Promise<PlayerProfile | null> => {
  const db = getDb()
  const rows = await db
    .select({
      id: players.id,
      fullName: sql<string>`${players.firstName} || ' ' || ${players.lastName}`,
      slug: players.slug,
      nationality: players.nationality,
      position: players.position,
      heightCm: players.heightCm,
      weightKg: players.weightKg,
      imageUrl: players.imageUrl,
      teamId: teams.id,
      teamName: teams.name,
      teamSlug: teams.slug,
      teamLogo: teams.logoUrl,
      leagueId: leagues.id,
      leagueName: leagues.name,
      leagueSlug: leagues.slug,
      leagueRegion: leagues.region,
    })
    .from(players)
    .innerJoin(playerSeasonStats, eq(playerSeasonStats.playerId, players.id))
    .innerJoin(seasons, eq(playerSeasonStats.seasonId, seasons.id))
    .innerJoin(leagues, eq(playerSeasonStats.leagueId, leagues.id))
    .leftJoin(teams, eq(playerSeasonStats.teamId, teams.id))
    .where(eq(players.slug, slug))
    .orderBy(desc(seasons.name), desc(playerSeasonStats.gamesPlayed))
    .limit(1)

  const r = rows[0]
  if (!r) return null

  const rawStatRows = await db
    .select({
      seasonId: seasons.id,
      seasonName: seasons.name,
      teamName: teams.name,
      gamesPlayed: playerSeasonStats.gamesPlayed,
      pointsTotal: playerSeasonStats.pointsTotal,
      reboundsTotal: playerSeasonStats.reboundsTotal,
      assistsTotal: playerSeasonStats.assistsTotal,
      stealsTotal: playerSeasonStats.stealsTotal,
      blocksTotal: playerSeasonStats.blocksTotal,
      turnoversTotal: playerSeasonStats.turnoversTotal,
      per: playerSeasonStats.per,
    })
    .from(playerSeasonStats)
    .innerJoin(seasons, eq(playerSeasonStats.seasonId, seasons.id))
    .leftJoin(teams, eq(playerSeasonStats.teamId, teams.id))
    .where(eq(playerSeasonStats.playerId, r.id))
    .orderBy(
      desc(seasons.name),
      desc(playerSeasonStats.gamesPlayed),
      sql`${playerSeasonStats.pointsTotal} desc nulls last`,
    )

  // Seasons and teams can be duplicated by sync (same label under different
  // ids); keep one line per season + team identity but preserve genuine
  // mid-season transfers, which carry distinct team names.
  const seenLines = new Set<string>()
  const statRows: PlayerProfile["seasons"] = []
  for (const row of rawStatRows) {
    const key = `${row.seasonName}::${(row.teamName ?? "").trim().toLowerCase()}`
    if (seenLines.has(key)) continue
    seenLines.add(key)
    statRows.push({
      seasonId: row.seasonId,
      seasonName: row.seasonName,
      gamesPlayed: row.gamesPlayed,
      pointsTotal: row.pointsTotal,
      reboundsTotal: row.reboundsTotal,
      assistsTotal: row.assistsTotal,
      stealsTotal: row.stealsTotal,
      blocksTotal: row.blocksTotal,
      turnoversTotal: row.turnoversTotal,
      per: row.per,
    })
  }

  return {
    id: r.id,
    fullName: String(r.fullName),
    slug: r.slug,
    nationality: r.nationality,
    position: r.position,
    heightCm: r.heightCm,
    weightKg: r.weightKg,
    imageUrl: r.imageUrl,
    league: {
      id: r.leagueId,
      name: r.leagueName,
      slug: r.leagueSlug,
      region: r.leagueRegion,
    },
    team:
      r.teamId && r.teamName && r.teamSlug
        ? {
            id: r.teamId,
            name: r.teamName,
            slug: r.teamSlug,
            logoUrl: r.teamLogo,
          }
        : null,
    seasons: statRows,
  }
  },
  "getPlayerBySlug",
  ["players", "player-season-stats"],
  3600,
)

type SearchCacheEntry = {
  expires: number
  results: { id: string; slug: string; fullName: string }[]
}
const SEARCH_CACHE = new Map<string, SearchCacheEntry>()
const SEARCH_CACHE_TTL_MS = 5 * 60 * 1000
const SEARCH_CACHE_MAX_ENTRIES = 200

function searchCacheKey(query: string, limit: number): string {
  return `${limit}::${query.trim().toLowerCase()}`
}

function readSearchCache(key: string): SearchCacheEntry["results"] | null {
  const entry = SEARCH_CACHE.get(key)
  if (!entry) return null
  if (entry.expires < Date.now()) {
    SEARCH_CACHE.delete(key)
    return null
  }
  return entry.results
}

function writeSearchCache(key: string, results: SearchCacheEntry["results"]): void {
  if (SEARCH_CACHE.size >= SEARCH_CACHE_MAX_ENTRIES) {
    const oldest = SEARCH_CACHE.keys().next().value
    if (oldest !== undefined) SEARCH_CACHE.delete(oldest)
  }
  SEARCH_CACHE.set(key, { expires: Date.now() + SEARCH_CACHE_TTL_MS, results })
}

export async function searchPlayersByName(
  query: string,
  limit = 20,
): Promise<{ id: string; slug: string; fullName: string }[]> {
  const key = searchCacheKey(query, limit)
  const cached = readSearchCache(key)
  if (cached) return cached

  const db = getDb()
  const cleaned = query.replace(/[\u0000-\u001f"()]/g, " ").trim()
  const q = `%${cleaned.toLowerCase()}%`
  const nameExpr = sql<string>`${players.firstName} || ' ' || ${players.lastName}`
  const results = await db
    .select({
      id: players.id,
      slug: players.slug,
      fullName: nameExpr,
    })
    .from(players)
    .where(ilike(sql<string>`${players.firstName} || ' ' || ${players.lastName}`, q))
    .limit(limit)

  writeSearchCache(key, results as { id: string; slug: string; fullName: string }[])
  return results as { id: string; slug: string; fullName: string }[]
}

export type AutocompletePlayer = {
  id: string
  slug: string
  fullName: string
  position: string | null
  nationality: string | null
  heightCm: number | null
  weightKg: number | null
  imageUrl: string | null
  team: { id: string; name: string; slug: string; logoUrl: string | null } | null
  league: { id: string; name: string; slug: string; region: string }
  season: {
    gamesPlayed: number
    pointsTotal: number | null
    reboundsTotal: number | null
    assistsTotal: number | null
    stealsTotal: number | null
    blocksTotal: number | null
    per: number | null
  } | null
}

export type AutocompleteSort = "points" | "assists" | "rebounds" | "name"

export type AutocompleteOptions = {
  league?: string
  sort?: AutocompleteSort
  limit?: number
}

const VALID_SORTS = new Set<AutocompleteSort>([
  "points", "assists", "rebounds", "name",
])

function mapRow(
  r: {
    id: string; slug: string; fullName: string
    position: string | null; nationality: string | null
    heightCm: number | null; weightKg: number | null; imageUrl: string | null
    teamId: string | null; teamName: string | null; teamSlug: string | null; teamLogo: string | null
    leagueId: string; leagueName: string; leagueSlug: string; leagueRegion: string
    seasonId: string | null; seasonName: string | null
    gamesPlayed: number | null
    pointsTotal: number | null; reboundsTotal: number | null; assistsTotal: number | null
    stealsTotal: number | null; blocksTotal: number | null; per: number | null
  },
): AutocompletePlayer {
  return {
    id: r.id,
    slug: r.slug,
    fullName: r.fullName,
    position: r.position,
    nationality: r.nationality,
    heightCm: r.heightCm,
    weightKg: r.weightKg,
    imageUrl: r.imageUrl,
    team:
      r.teamId && r.teamName && r.teamSlug
        ? { id: r.teamId, name: r.teamName, slug: r.teamSlug, logoUrl: r.teamLogo }
        : null,
    league: {
      id: r.leagueId, name: r.leagueName, slug: r.leagueSlug, region: r.leagueRegion,
    },
    season: r.seasonId
      ? {
          gamesPlayed: r.gamesPlayed ?? 0,
          pointsTotal: r.pointsTotal,
          reboundsTotal: r.reboundsTotal,
          assistsTotal: r.assistsTotal,
          stealsTotal: r.stealsTotal,
          blocksTotal: r.blocksTotal,
          per: r.per,
        }
      : null,
  }
}

const AUTOCOMPLETE_COLUMNS = {
  id: players.id,
  slug: players.slug,
  fullName: sql<string>`${players.firstName} || ' ' || ${players.lastName}`,
  position: players.position,
  nationality: players.nationality,
  heightCm: players.heightCm,
  weightKg: players.weightKg,
  imageUrl: players.imageUrl,
  teamId: teams.id,
  teamName: teams.name,
  teamSlug: teams.slug,
  teamLogo: teams.logoUrl,
  leagueId: leagues.id,
  leagueName: leagues.name,
  leagueSlug: leagues.slug,
  leagueRegion: leagues.region,
  seasonId: seasons.id,
  seasonName: seasons.name,
  gamesPlayed: playerSeasonStats.gamesPlayed,
  pointsTotal: playerSeasonStats.pointsTotal,
  reboundsTotal: playerSeasonStats.reboundsTotal,
  assistsTotal: playerSeasonStats.assistsTotal,
  stealsTotal: playerSeasonStats.stealsTotal,
  blocksTotal: playerSeasonStats.blocksTotal,
  per: playerSeasonStats.per,
} as const

async function runAutocomplete(
  pattern: string | null,
  options: AutocompleteOptions,
): Promise<AutocompletePlayer[]> {
  const db = getDb()
  const limit = options.limit ?? 12
  const sort: AutocompleteSort = VALID_SORTS.has(options.sort as AutocompleteSort)
    ? (options.sort as AutocompleteSort)
    : "points"

  const nameExpr = sql<string>`lower(${players.firstName} || ' ' || ${players.lastName})`

  const conditions = []
  if (pattern) conditions.push(like(nameExpr, pattern))
  if (options.league) conditions.push(eq(leagues.slug, options.league))
  const where = conditions.length ? and(...conditions) : undefined

  const orderBy = (() => {
    if (sort === "name") return asc(nameExpr)
    const col =
      sort === "assists"
        ? playerSeasonStats.assistsTotal
        : sort === "rebounds"
          ? playerSeasonStats.reboundsTotal
          : playerSeasonStats.pointsTotal
    return desc(sql`coalesce(${col}, 0)`)
  })()

  const rows = await db
    .select(AUTOCOMPLETE_COLUMNS)
    .from(players)
    .innerJoin(
      playerSeasonStats,
      eq(playerSeasonStats.playerId, players.id),
    )
    .innerJoin(leagues, eq(playerSeasonStats.leagueId, leagues.id))
    .leftJoin(teams, eq(playerSeasonStats.teamId, teams.id))
    .leftJoin(seasons, eq(playerSeasonStats.seasonId, seasons.id))
    .where(where)
    .orderBy(orderBy, desc(sql`coalesce(${playerSeasonStats.gamesPlayed}, 0)`))
    .limit(limit * 3)

  // The join yields one row per stat line; duplicated seasons/teams from sync
  // would repeat a player, so keep only their best row.
  const seen = new Set<string>()
  const deduped: typeof rows = []
  for (const row of rows) {
    if (seen.has(row.id)) continue
    seen.add(row.id)
    deduped.push(row)
    if (deduped.length === limit) break
  }
  return deduped.map(mapRow)
}

export function rankByQuery(
  results: AutocompletePlayer[],
  query: string,
): AutocompletePlayer[] {
  const q = query.trim().toLowerCase()
  if (!q) return results
  const score = (p: AutocompletePlayer) => {
    const name = p.fullName.toLowerCase()
    if (name === q) return 0
    if (name.startsWith(q)) return 1
    const lastName = name.split(" ").slice(-1)[0] ?? name
    if (lastName.startsWith(q)) return 2
    if (name.includes(" " + q)) return 3
    if (name.includes(q)) return 4
    return 5
  }
  return [...results].sort((a, b) => score(a) - score(b))
}

export async function searchPlayersAutocomplete(
  query: string,
  options: AutocompleteOptions = {},
): Promise<AutocompletePlayer[]> {
  const q = query.trim()
  if (q.length < 1) return runAutocomplete(null, options)
  return runAutocomplete(`%${q.toLowerCase()}%`, options)
}

export async function listTopPlayers(
  options: AutocompleteOptions = {},
): Promise<AutocompletePlayer[]> {
  return runAutocomplete(null, options)
}

export type LeagueSummary = {
  id: string
  name: string
  slug: string
  region: string
  logoUrl: string | null
  teamCount: number
  playerCount: number
}

export const listLeagues = cached(
  async (): Promise<LeagueSummary[]> => {
  const db = getDb()
  const rows = await db
    .select({
      id: leagues.id,
      name: leagues.name,
      slug: leagues.slug,
      region: leagues.region,
      logoUrl: leagues.logoUrl,
    })
    .from(leagues)

  const out: LeagueSummary[] = []
  for (const lg of rows) {
    const [t] = await db
      .select({ count: sql<number>`count(distinct team_id)` })
      .from(playerSeasonStats)
      .where(eq(playerSeasonStats.leagueId, lg.id))
    const [p] = await db
      .select({ count: sql<number>`count(distinct player_id)` })
      .from(playerSeasonStats)
      .where(eq(playerSeasonStats.leagueId, lg.id))
    out.push({
      id: lg.id,
      name: lg.name,
      slug: lg.slug,
      region: lg.region,
      logoUrl: lg.logoUrl,
      teamCount: Number(t?.count ?? 0),
      playerCount: Number(p?.count ?? 0),
    })
  }
  return out
  },
  "listLeagues",
  ["leagues"],
  600,
)

export async function listAllPlayerSlugs(
  limit = 5000,
): Promise<Array<{ slug: string }>> {
  const db = getDb()
  return db
    .select({ slug: players.slug })
    .from(players)
    .orderBy(asc(players.slug))
    .limit(limit)
}
