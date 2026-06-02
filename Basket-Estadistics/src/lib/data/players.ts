import { and, asc, desc, eq, like, or, sql } from "drizzle-orm"
import { getDb, closeDb } from "@/lib/db/client"
import {
  leagues,
  playerStats,
  players,
  seasons,
  teams,
} from "@/lib/db/schema"

export type PlayerListItem = {
  id: string
  fullName: string
  slug: string
  nationality: string | null
  position: string | null
  photoUrl: string | null
  league: { id: string; name: string; slug: string; country: string }
  team: { id: string; name: string; slug: string; logoUrl: string | null } | null
  stats: {
    gamesPlayed: number
    points: number | null
    rebounds: number | null
    assists: number | null
    steals: number | null
    blocks: number | null
  } | null
}

export type ListPlayersInput = {
  query?: string
  league?: string
  team?: string
  sort?: "points" | "rebounds" | "assists" | "name"
  order?: "asc" | "desc"
  limit?: number
}

export async function listPlayers(
  input: ListPlayersInput = {},
): Promise<PlayerListItem[]> {
  const db = getDb()
  const limit = input.limit ?? 60
  const order = input.order ?? "desc"
  const sort = input.sort ?? "points"

  const conditions = []
  if (input.league) conditions.push(eq(leagues.slug, input.league))
  if (input.team) {
    const tq = `%${input.team.toLowerCase()}%`
    conditions.push(like(sql`lower(${teams.name})`, tq))
  }
  if (input.query) {
    const q = `%${input.query.toLowerCase()}%`
    conditions.push(like(sql`lower(${players.fullName})`, q))
  }
  const where = conditions.length ? and(...conditions) : undefined

  const orderExpr = (() => {
    const dir = order === "asc" ? asc : desc
    if (sort === "name") return dir(players.fullName)
    const col = (() => {
      switch (sort) {
        case "rebounds":
          return playerStats.rebounds
        case "assists":
          return playerStats.assists
        case "points":
        default:
          return playerStats.points
      }
    })()
    return dir(sql`coalesce(${col}, 0)`)
  })()

  const rows = await db
    .select({
      playerId: players.id,
      fullName: players.fullName,
      slug: players.slug,
      nationality: players.nationality,
      position: players.position,
      photoUrl: players.photoUrl,
      source: players.source,
      leagueId: leagues.id,
      leagueName: leagues.name,
      leagueSlug: leagues.slug,
      leagueCountry: leagues.country,
      teamId: teams.id,
      teamName: teams.name,
      teamSlug: teams.slug,
      teamLogo: teams.logoUrl,
      gamesPlayed: playerStats.gamesPlayed,
      points: playerStats.points,
      rebounds: playerStats.rebounds,
      assists: playerStats.assists,
      steals: playerStats.steals,
      blocks: playerStats.blocks,
    })
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
    .where(where)
    .orderBy(orderExpr)
    .limit(limit)

  return rows.map((r) => ({
    id: r.playerId,
    fullName: r.fullName,
    slug: r.slug,
    nationality: r.nationality,
    position: r.position,
    photoUrl: r.photoUrl,
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
    stats:
      r.gamesPlayed == null
        ? null
        : {
            gamesPlayed: r.gamesPlayed,
            points: r.points,
            rebounds: r.rebounds,
            assists: r.assists,
            steals: r.steals,
            blocks: r.blocks,
          },
  }))
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

export async function getPlayerBySlug(
  slug: string,
): Promise<PlayerProfile | null> {
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
}

export async function searchPlayersByName(
  query: string,
  limit = 20,
): Promise<{ id: string; slug: string; fullName: string }[]> {
  const db = getDb()
  const q = `%${query.toLowerCase()}%`
  return db
    .select({
      id: players.id,
      slug: players.slug,
      fullName: players.fullName,
    })
    .from(players)
    .where(like(sql`lower(${players.fullName})`, q))
    .limit(limit)
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

export async function listLeagues(): Promise<LeagueSummary[]> {
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
}

void or
void closeDb
