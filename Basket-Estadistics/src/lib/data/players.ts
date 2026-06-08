import { and, asc, desc, eq, like, sql } from "drizzle-orm"
import { getDb } from "@/lib/db/client"
import {
  leagues,
  playerStats,
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
  birthdate: string | null
  heightCm: number | null
  weightKg: number | null
  photoUrl: string | null
  source: string
  league: { id: string; name: string; slug: string; country: string }
  team: { id: string; name: string; slug: string; logoUrl: string | null } | null
  stats: {
    seasonId: string
    seasonName: string
    year: number
    gamesPlayed: number
    minutesPerGame: number | null
    points: number | null
    rebounds: number | null
    assists: number | null
    steals: number | null
    blocks: number | null
    turnovers: number | null
    fgPct: number | null
    threePct: number | null
    ftPct: number | null
    offRtg: number | null
    defRtg: number | null
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
        return sql`coalesce(rebounds, 0)`
      case "assists":
        return sql`coalesce(assists, 0)`
      case "name":
        return sql`lower(p_full_name)`
      case "points":
      default:
        return sql`coalesce(points, 0)`
    }
  })()
  const orderDir = order === "asc" ? sql`asc` : sql`desc`

  const teamFilter = input.team
    ? sql`lower(coalesce(t.name, '')) like ${`%${input.team.toLowerCase()}%`}`
    : sql`1=1`
  const queryFilter = input.query
    ? sql`lower(p.full_name) like ${`%${input.query.toLowerCase()}%`}`
    : sql`1=1`
  const leagueSlugs = leagueSlugsFor(input.league)
  const leagueFilter = leagueSlugs
    ? sql`l.slug in (${sql.join(
        leagueSlugs.map((s) => sql`${s}`),
        sql`, `,
      )})`
    : sql`1=1`

  const fullSql = sql`
    with memberships as (
      select
        ps.player_id,
        s.league_id,
        ps.season_id,
        s.year as season_year,
        s.name as season_name,
        ps.team_id,
        ps.games_played,
        ps.minutes_per_game,
        ps.points,
        ps.rebounds,
        ps.assists,
        ps.steals,
        ps.blocks,
        ps.turnovers,
        ps.fg_pct,
        ps.three_pct,
        ps.ft_pct,
        ps.off_rtg,
        ps.def_rtg,
        ps.per
      from ${playerStats} ps
      inner join ${seasons} s on s.id = ps.season_id

      union all

      select
        p.id as player_id,
        l_src.id as league_id,
        cast(null as text) as season_id,
        cast(null as integer) as season_year,
        cast(null as text) as season_name,
        p.current_team_id as team_id,
        cast(null as integer) as games_played,
        cast(null as real) as minutes_per_game,
        cast(null as real) as points,
        cast(null as real) as rebounds,
        cast(null as real) as assists,
        cast(null as real) as steals,
        cast(null as real) as blocks,
        cast(null as real) as turnovers,
        cast(null as real) as fg_pct,
        cast(null as real) as three_pct,
        cast(null as real) as ft_pct,
        cast(null as real) as off_rtg,
        cast(null as real) as def_rtg,
        cast(null as real) as per
      from ${players} p
      inner join ${leagues} l_src on l_src.source = p.source
      where not exists (
        select 1 from ${playerStats} ps2 where ps2.player_id = p.id
      )
    ),
    ranked as (
      select
        m.*,
        p.id as p_id,
        p.full_name as p_full_name,
        p.slug as p_slug,
        p.nationality as p_nationality,
        p.position as p_position,
        p.birthdate as p_birthdate,
        p.height_cm as p_height_cm,
        p.weight_kg as p_weight_kg,
        p.photo_url as p_photo_url,
        p.source as p_source,
        p.updated_at as p_updated_at,
        l.id as l_id,
        l.name as l_name,
        l.slug as l_slug,
        l.country as l_country,
        t.id as t_id,
        t.name as t_name,
        t.slug as t_slug,
        t.logo_url as t_logo_url,
        row_number() over (
          partition by lower(p.full_name)
          order by
            coalesce(m.games_played, 0) desc,
            case when p.photo_url is not null then 0 else 1 end,
            case when p.nationality is not null then 0 else 1 end,
            case when p.position is not null then 0 else 1 end,
            p.updated_at desc
        ) as rn
      from memberships m
      inner join ${players} p on p.id = m.player_id
      inner join ${leagues} l on l.id = m.league_id
      left join ${teams} t on t.id = m.team_id
      where
        ${leagueFilter}
        and ${teamFilter}
        and ${queryFilter}
    )
    select
      p_id as player_id,
      p_full_name as full_name,
      p_slug as slug,
      p_nationality as nationality,
      p_position as position,
      p_birthdate as birthdate,
      p_height_cm as height_cm,
      p_weight_kg as weight_kg,
      p_photo_url as photo_url,
      p_source as source,
      l_id as league_id,
      l_name as league_name,
      l_slug as league_slug,
      l_country as league_country,
      t_id as team_id,
      t_name as team_name,
      t_slug as team_slug,
      t_logo_url as team_logo,
      season_id,
      season_year,
      season_name,
      games_played,
      minutes_per_game,
      points,
      rebounds,
      assists,
      steals,
      blocks,
      turnovers,
      fg_pct,
      three_pct,
      ft_pct,
      off_rtg,
      def_rtg,
      per
    from ranked
    where ${input.league ? sql`rn = 1` : sql`rn = 1`}
    order by ${sortColumn} ${orderDir}, p_full_name ${orderDir}
    limit ${pageSize} offset ${offset}
  `

  const countSql = sql`
    with memberships as (
      select
        ps.player_id,
        s.league_id,
        ps.season_id,
        ps.team_id,
        ps.games_played
      from ${playerStats} ps
      inner join ${seasons} s on s.id = ps.season_id

      union all

      select
        p.id as player_id,
        l_src.id as league_id,
        cast(null as text) as season_id,
        p.current_team_id as team_id,
        cast(null as integer) as games_played
      from ${players} p
      inner join ${leagues} l_src on l_src.source = p.source
      where not exists (
        select 1 from ${playerStats} ps2 where ps2.player_id = p.id
      )
    ),
    ranked as (
      select
        p.id as p_id,
        p.full_name as p_full_name,
        p.photo_url as p_photo_url,
        p.nationality as p_nationality,
        p.position as p_position,
        p.updated_at as p_updated_at,
        m.games_played as m_games_played,
        row_number() over (
          partition by lower(p.full_name)
          order by
            coalesce(m.games_played, 0) desc,
            case when p.photo_url is not null then 0 else 1 end,
            case when p.nationality is not null then 0 else 1 end,
            case when p.position is not null then 0 else 1 end,
            p.updated_at desc
        ) as rn
      from memberships m
      inner join ${players} p on p.id = m.player_id
      inner join ${leagues} l on l.id = m.league_id
      left join ${teams} t on t.id = m.team_id
      where
        ${leagueFilter}
        and ${teamFilter}
        and ${queryFilter}
    )
    select count(*) as c from ranked where rn = 1
  `

  const [countRow] = (await db.all(countSql)) as Array<{ c: number | string }>
  const total = Number(countRow?.c ?? 0)

  const rawRows = (await db.all(fullSql)) as Array<{
    player_id: string
    full_name: string
    slug: string
    nationality: string | null
    position: string | null
    birthdate: string | null
    height_cm: number | null
    weight_kg: number | null
    photo_url: string | null
    source: string
    league_id: string
    league_name: string
    league_slug: string
    league_country: string
    team_id: string | null
    team_name: string | null
    team_slug: string | null
    team_logo: string | null
    season_id: string | null
    season_year: number | null
    season_name: string | null
    games_played: number | null
    minutes_per_game: number | null
    points: number | null
    rebounds: number | null
    assists: number | null
    steals: number | null
    blocks: number | null
    turnovers: number | null
    fg_pct: number | null
    three_pct: number | null
    ft_pct: number | null
    off_rtg: number | null
    def_rtg: number | null
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
      birthdate: r.birthdate,
      heightCm: r.height_cm,
      weightKg: r.weight_kg,
      photoUrl: r.photo_url,
      source: r.source,
      league: {
        id: r.league_id,
        name: r.league_name,
        slug: r.league_slug,
        country: r.league_country,
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
              year: r.season_year ?? 0,
              gamesPlayed: r.games_played,
              minutesPerGame: r.minutes_per_game,
              points: r.points,
              rebounds: r.rebounds,
              assists: r.assists,
              steals: r.steals,
              blocks: r.blocks,
              turnovers: r.turnovers,
              fgPct: r.fg_pct,
              threePct: r.three_pct,
              ftPct: r.ft_pct,
              offRtg: r.off_rtg,
              defRtg: r.def_rtg,
              per: r.per,
            },
    })),
    total,
    page,
    pageSize,
    totalPages,
  }
}

export type PlayerProfile = {
  id: string
  fullName: string
  slug: string
  nationality: string | null
  position: string | null
  birthdate: string | null
  heightCm: number | null
  weightKg: number | null
  photoUrl: string | null
  source: string
  league: { id: string; name: string; slug: string; country: string }
  team: { id: string; name: string; slug: string; logoUrl: string | null } | null
  seasons: Array<{
    seasonId: string
    year: number
    gamesPlayed: number
    minutesPerGame: number | null
    points: number | null
    rebounds: number | null
    assists: number | null
    steals: number | null
    blocks: number | null
    turnovers: number | null
    fgPct: number | null
    threePct: number | null
    ftPct: number | null
  }>
}

export const getPlayerBySlug = cached(
  async (slug: string): Promise<PlayerProfile | null> => {
  const db = getDb()
  const rows = await db
    .select({
      id: players.id,
      fullName: players.fullName,
      slug: players.slug,
      nationality: players.nationality,
      position: players.position,
      birthdate: players.birthdate,
      heightCm: players.heightCm,
      weightKg: players.weightKg,
      photoUrl: players.photoUrl,
      source: players.source,
      teamId: teams.id,
      teamName: teams.name,
      teamSlug: teams.slug,
      teamLogo: teams.logoUrl,
      leagueId: leagues.id,
      leagueName: leagues.name,
      leagueSlug: leagues.slug,
      leagueCountry: leagues.country,
    })
    .from(players)
    .innerJoin(leagues, eq(players.source, leagues.source))
    .leftJoin(teams, eq(players.currentTeamId, teams.id))
    .where(eq(players.slug, slug))
    .limit(1)

  const r = rows[0]
  if (!r) return null

  const statRows = await db
    .select({
      seasonId: seasons.id,
      year: seasons.year,
      gamesPlayed: playerStats.gamesPlayed,
      minutesPerGame: playerStats.minutesPerGame,
      points: playerStats.points,
      rebounds: playerStats.rebounds,
      assists: playerStats.assists,
      steals: playerStats.steals,
      blocks: playerStats.blocks,
      turnovers: playerStats.turnovers,
      fgPct: playerStats.fgPct,
      threePct: playerStats.threePct,
      ftPct: playerStats.ftPct,
    })
    .from(playerStats)
    .innerJoin(seasons, eq(playerStats.seasonId, seasons.id))
    .where(
      and(
        eq(playerStats.playerId, r.id),
        eq(seasons.leagueId, r.leagueId),
      ),
    )
    .orderBy(desc(seasons.year))

  return {
    id: r.id,
    fullName: r.fullName,
    slug: r.slug,
    nationality: r.nationality,
    position: r.position,
    birthdate: r.birthdate,
    heightCm: r.heightCm,
    weightKg: r.weightKg,
    photoUrl: r.photoUrl,
    source: r.source,
    league: {
      id: r.leagueId,
      name: r.leagueName,
      slug: r.leagueSlug,
      country: r.leagueCountry,
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
  ["players", "player-stats"],
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
  const matchExpr = cleaned ? `${cleaned}*` : null
  let results: { id: string; slug: string; fullName: string }[] = []
  if (matchExpr) {
    try {
      const rows = (await db.all(sql`
        select p.id, p.slug, p.full_name
        from ${players} p
        inner join players_fts f on f.rowid = p.rowid
        where players_fts match ${matchExpr}
        order by rank
        limit ${limit}
      `)) as Array<{ id: string; slug: string; full_name: string }>
      if (rows.length > 0) {
        results = rows.map((r) => ({
          id: r.id,
          slug: r.slug,
          fullName: r.full_name,
        }))
      }
    } catch {
      // players_fts unavailable (e.g. running against a backend that lacks FTS5);
      // fall through to the LIKE-based query below.
    }
  }

  if (results.length === 0) {
    const q = `%${query.toLowerCase()}%`
    results = await db
      .select({
        id: players.id,
        slug: players.slug,
        fullName: players.fullName,
      })
      .from(players)
      .where(like(sql`lower(${players.fullName})`, q))
      .limit(limit)
  }

  writeSearchCache(key, results)
  return results
}

export type AutocompletePlayer = {
  id: string
  slug: string
  fullName: string
  position: string | null
  nationality: string | null
  birthdate: string | null
  heightCm: number | null
  weightKg: number | null
  photoUrl: string | null
  team: { id: string; name: string; slug: string; logoUrl: string | null } | null
  league: { id: string; name: string; slug: string; country: string }
  season: {
    year: number
    name: string
    gamesPlayed: number
    points: number | null
    rebounds: number | null
    assists: number | null
    steals: number | null
    blocks: number | null
    fgPct: number | null
    threePct: number | null
    ftPct: number | null
  } | null
}

export type AutocompleteSort = "points" | "assists" | "rebounds" | "name"

export type AutocompleteOptions = {
  league?: string
  sort?: AutocompleteSort
  limit?: number
}

const VALID_SORTS = new Set<AutocompleteSort>([
  "points",
  "assists",
  "rebounds",
  "name",
])

function mapRow(
  r: {
    id: string
    slug: string
    fullName: string
    position: string | null
    nationality: string | null
    birthdate: string | null
    heightCm: number | null
    weightKg: number | null
    photoUrl: string | null
    teamId: string | null
    teamName: string | null
    teamSlug: string | null
    teamLogo: string | null
    leagueId: string
    leagueName: string
    leagueSlug: string
    leagueCountry: string
    seasonId: string | null
    seasonYear: number | null
    seasonName: string | null
    gamesPlayed: number | null
    points: number | null
    rebounds: number | null
    assists: number | null
    steals: number | null
    blocks: number | null
    fgPct: number | null
    threePct: number | null
    ftPct: number | null
  },
): AutocompletePlayer {
  return {
    id: r.id,
    slug: r.slug,
    fullName: r.fullName,
    position: r.position,
    nationality: r.nationality,
    birthdate: r.birthdate,
    heightCm: r.heightCm,
    weightKg: r.weightKg,
    photoUrl: r.photoUrl,
    team:
      r.teamId && r.teamName && r.teamSlug
        ? {
            id: r.teamId,
            name: r.teamName,
            slug: r.teamSlug,
            logoUrl: r.teamLogo,
          }
        : null,
    league: {
      id: r.leagueId,
      name: r.leagueName,
      slug: r.leagueSlug,
      country: r.leagueCountry,
    },
    season: r.seasonId
      ? {
          year: r.seasonYear!,
          name: r.seasonName!,
          gamesPlayed: r.gamesPlayed ?? 0,
          points: r.points,
          rebounds: r.rebounds,
          assists: r.assists,
          steals: r.steals,
          blocks: r.blocks,
          fgPct: r.fgPct,
          threePct: r.threePct,
          ftPct: r.ftPct,
        }
      : null,
  }
}

const AUTOCOMPLETE_COLUMNS = {
  id: players.id,
  slug: players.slug,
  fullName: players.fullName,
  position: players.position,
  nationality: players.nationality,
  birthdate: players.birthdate,
  heightCm: players.heightCm,
  weightKg: players.weightKg,
  photoUrl: players.photoUrl,
  teamId: teams.id,
  teamName: teams.name,
  teamSlug: teams.slug,
  teamLogo: teams.logoUrl,
  leagueId: leagues.id,
  leagueName: leagues.name,
  leagueSlug: leagues.slug,
  leagueCountry: leagues.country,
  seasonId: seasons.id,
  seasonYear: seasons.year,
  seasonName: seasons.name,
  gamesPlayed: playerStats.gamesPlayed,
  points: playerStats.points,
  rebounds: playerStats.rebounds,
  assists: playerStats.assists,
  steals: playerStats.steals,
  blocks: playerStats.blocks,
  fgPct: playerStats.fgPct,
  threePct: playerStats.threePct,
  ftPct: playerStats.ftPct,
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

  const conditions = []
  if (pattern) conditions.push(like(sql`lower(${players.fullName})`, pattern))
  if (options.league) conditions.push(eq(leagues.slug, options.league))
  const where = conditions.length ? and(...conditions) : undefined

  const orderBy = (() => {
    if (sort === "name") return asc(players.fullName)
    const col =
      sort === "assists"
        ? playerStats.assists
        : sort === "rebounds"
          ? playerStats.rebounds
          : playerStats.points
    return desc(sql`coalesce(${col}, 0)`)
  })()

  const rows = await db
    .select(AUTOCOMPLETE_COLUMNS)
    .from(players)
    .innerJoin(leagues, eq(players.source, leagues.source))
    .leftJoin(teams, eq(players.currentTeamId, teams.id))
    .leftJoin(
      playerStats,
      and(
        eq(playerStats.playerId, players.id),
        eq(
          playerStats.seasonId,
          sql`(select s.id from seasons s where s.league_id = ${leagues.id} order by s.year desc limit 1)`,
        ),
      ),
    )
    .leftJoin(seasons, eq(playerStats.seasonId, seasons.id))
    .where(where)
    .orderBy(orderBy)
    .limit(limit)

  return rows.map(mapRow)
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
  country: string
  logoUrl: string | null
  source: string
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
      country: leagues.country,
      logoUrl: leagues.logoUrl,
      source: leagues.source,
    })
    .from(leagues)

  const out: LeagueSummary[] = []
  for (const lg of rows) {
    const [t] = await db
      .select({ count: sql<number>`count(*)` })
      .from(teams)
      .where(eq(teams.leagueId, lg.id))
    const [p] = await db
      .select({ count: sql<number>`count(*)` })
      .from(players)
      .where(eq(players.source, lg.source))
    out.push({
      id: lg.id,
      name: lg.name,
      slug: lg.slug,
      country: lg.country,
      logoUrl: lg.logoUrl,
      source: lg.source,
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
