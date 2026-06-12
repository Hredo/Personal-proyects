import { and, asc, eq, inArray, like, sql, type SQL } from "drizzle-orm"
import { getDb } from "@/lib/db/client"
import { leagues, playerSeasonStats, teams } from "@/lib/db/schema"
import type { CoachListItem } from "@/lib/data/staff"
import { cached } from "@/lib/data/cache"
import { leagueSlugsFor } from "@/lib/league-groups"

export type TeamListItem = {
  id: string
  name: string
  slug: string
  logoUrl: string | null
  city: string | null
  league: { id: string; name: string; slug: string; region: string }
  playerCount: number
}

export type ListTeamsInput = {
  query?: string
  league?: string
  sort?: "name" | "players"
  order?: "asc" | "desc"
  page?: number
  pageSize?: number
}

export type ListTeamsResult = {
  items: TeamListItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export async function listTeams(
  input: ListTeamsInput = {},
): Promise<ListTeamsResult> {
  const db = getDb()
  const page = Math.max(1, input.page ?? 1)
  const pageSize = Math.max(1, Math.min(input.pageSize ?? 24, 200))
  const order = input.order ?? "asc"
  const sort = input.sort ?? "name"
  const offset = (page - 1) * pageSize

  const leagueSlugs = leagueSlugsFor(input.league)
  const conditions: (SQL | undefined)[] = []

  conditions.push(
    sql`exists (select 1 from ${playerSeasonStats} where team_id = ${teams.id})`,
  )

  if (leagueSlugs) {
    const orParts = leagueSlugs.map((slug) =>
      sql`exists (
        select 1 from ${playerSeasonStats} pss_l
        inner join ${leagues} l_l on l_l.id = pss_l.league_id
        where pss_l.team_id = ${teams.id}
        and l_l.slug = ${slug}
      )`,
    )
    conditions.push(
      orParts.length === 1
        ? orParts[0]
        : sql`(${sql.join(orParts, sql` or `)})`,
    )
  }

  if (input.query) {
    const q = `%${input.query.toLowerCase()}%`
    conditions.push(like(sql`lower(${teams.name})`, q))
  }

  const where = and(...conditions.filter(Boolean))

  // NOTE: the outer team id must be written as an explicit qualified
  // identifier, NOT as `${teams.id}`. When a Drizzle Column object is
  // interpolated into a `sql` expression that is used as a SELECT-projection
  // field (or ORDER BY), Drizzle renders it WITHOUT the table prefix — so
  // `${teams.id}` would become a bare `"id"`, which Postgres binds to the
  // inner `pss.id` (player_season_stats also has an `id` column). The
  // correlation `pss.team_id = pss.id` never matches, silently yielding 0 for
  // every team. Qualifying explicitly keeps it correlated to the outer row.
  const teamId = sql`${sql.identifier("teams")}.${sql.identifier("id")}`
  const playerCountExpr = sql<number>`(
    select count(distinct pss.player_id) from ${playerSeasonStats} pss
    where pss.team_id = ${teamId}
  )`

  const countResult = await db
    .select({ c: sql<number>`count(*)` })
    .from(teams)
    .where(where)
  const total = Number(countResult[0]?.c ?? 0)

  const dir = order === "asc" ? sql`asc` : sql`desc`
  const orderByExpr =
    sort === "players"
      ? sql`coalesce(${playerCountExpr}, 0) ${dir}, ${teams.name} ${dir}`
      : sql`${teams.name} ${dir}`

  const rows = await db
    .select({
      id: teams.id,
      name: teams.name,
      slug: teams.slug,
      logoUrl: teams.logoUrl,
      city: teams.city,
      playerCount: playerCountExpr,
    })
    .from(teams)
    .where(where)
    .orderBy(orderByExpr)
    .limit(pageSize)
    .offset(offset)

  const teamIds = rows.map((r) => r.id)
  const leagueByTeam = new Map<
    string,
    { id: string; name: string; slug: string; region: string }
  >()

  if (teamIds.length > 0) {
    const leagueRows = await db
      .selectDistinct({
        teamId: playerSeasonStats.teamId,
        leagueId: leagues.id,
        leagueName: leagues.name,
        leagueSlug: leagues.slug,
        leagueRegion: leagues.region,
      })
      .from(playerSeasonStats)
      .innerJoin(leagues, eq(playerSeasonStats.leagueId, leagues.id))
      .where(
        and(
          inArray(playerSeasonStats.teamId, teamIds),
          leagueSlugs ? inArray(leagues.slug, leagueSlugs) : undefined,
        ),
      )

    for (const l of leagueRows) {
      if (!leagueByTeam.has(l.teamId)) {
        leagueByTeam.set(l.teamId, {
          id: l.leagueId,
          name: l.leagueName,
          slug: l.leagueSlug,
          region: l.leagueRegion,
        })
      }
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return {
    items: rows.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      logoUrl: r.logoUrl,
      city: r.city,
      league: leagueByTeam.get(r.id) ?? {
        id: "",
        name: "",
        slug: "",
        region: "",
      },
      playerCount: Number(r.playerCount ?? 0),
    })),
    total,
    page,
    pageSize,
    totalPages,
  }
}

export type TeamOption = { id: string; name: string; slug: string; leagueSlug: string }

export async function listTeamOptions(limit = 300): Promise<TeamOption[]> {
  const db = getDb()
  const tl = db.$with("tl").as(
    db
      .selectDistinct({
        teamId: playerSeasonStats.teamId,
        leagueId: playerSeasonStats.leagueId,
      })
      .from(playerSeasonStats),
  )
  const rows = await db
    .with(tl)
    .select({
      id: teams.id,
      name: teams.name,
      slug: teams.slug,
      leagueSlug: leagues.slug,
    })
    .from(teams)
    .innerJoin(tl, eq(teams.id, tl.teamId))
    .innerJoin(leagues, eq(tl.leagueId, leagues.id))
    .orderBy(asc(teams.name))
    .limit(limit)
  return rows
}

// Only the fields the roster UI (PlayerCard) and the AI advisor actually
// consume; the full PlayerListItem would otherwise be serialized into the
// page payload for every player.
export type RosterPlayer = {
  id: string
  fullName: string
  slug: string
  nationality: string | null
  position: string | null
  heightCm: number | null
  weightKg: number | null
  imageUrl: string | null
  league: { name: string; slug: string }
  team: { name: string; logoUrl: string | null } | null
  stats: {
    seasonName: string
    gamesPlayed: number
    pointsTotal: number | null
    reboundsTotal: number | null
    assistsTotal: number | null
    stealsTotal: number | null
    blocksTotal: number | null
    fgPct: number | null
    threePct: number | null
    ftPct: number | null
    per: number | null
  } | null
}

export type TeamProfile = {
  id: string
  name: string
  slug: string
  logoUrl: string | null
  city: string | null
  league: { id: string; name: string; slug: string; region: string }
  roster: RosterPlayer[]
  staff: CoachListItem[]
}

export const getTeamBySlug = cached(
  async (leagueSlug: string, slug: string): Promise<TeamProfile | null> => {
  const db = getDb()
  const tl = db.$with("tl").as(
    db
      .selectDistinct({
        teamId: playerSeasonStats.teamId,
        leagueId: playerSeasonStats.leagueId,
      })
      .from(playerSeasonStats),
  )
  const rows = await db
    .with(tl)
    .select({
      id: teams.id,
      name: teams.name,
      slug: teams.slug,
      logoUrl: teams.logoUrl,
      city: teams.city,
      leagueId: leagues.id,
      leagueName: leagues.name,
      leagueSlug: leagues.slug,
      leagueRegion: leagues.region,
    })
    .from(teams)
    .innerJoin(tl, eq(teams.id, tl.teamId))
    .innerJoin(leagues, eq(tl.leagueId, leagues.id))
    .where(and(eq(leagues.slug, leagueSlug), eq(teams.slug, slug)))
    .limit(1)

  const r = rows[0]
  if (!r) return null

  const { listPlayers } = await import("@/lib/data/players")
  const { listCoachesByTeam } = await import("@/lib/data/staff")

  const [roster, staff] = await Promise.all([
    listPlayers({
      league: leagueSlug,
      team: r.name,
      sort: "name",
      order: "asc",
      pageSize: 200,
    }),
    listCoachesByTeam(r.id),
  ])

  return {
    id: r.id,
    name: r.name,
    slug: r.slug,
    logoUrl: r.logoUrl,
    city: r.city,
    league: {
      id: r.leagueId,
      name: r.leagueName,
      slug: r.leagueSlug,
      region: r.leagueRegion,
    },
    roster: roster.items.map((p) => ({
      id: p.id,
      fullName: p.fullName,
      slug: p.slug,
      nationality: p.nationality,
      position: p.position,
      heightCm: p.heightCm,
      weightKg: p.weightKg,
      imageUrl: p.imageUrl,
      league: { name: p.league.name, slug: p.league.slug },
      team: p.team ? { name: p.team.name, logoUrl: p.team.logoUrl } : null,
      stats: p.stats
        ? {
            seasonName: p.stats.seasonName,
            gamesPlayed: p.stats.gamesPlayed,
            pointsTotal: p.stats.pointsTotal,
            reboundsTotal: p.stats.reboundsTotal,
            assistsTotal: p.stats.assistsTotal,
            stealsTotal: p.stats.stealsTotal,
            blocksTotal: p.stats.blocksTotal,
            fgPct: p.stats.fgPct,
            threePct: p.stats.threePct,
            ftPct: p.stats.ftPct,
            per: p.stats.per,
          }
        : null,
    })),
    staff,
  }
  },
  // v2: cached entries can outlive deploys; key versioned for the slim
  // RosterPlayer shape.
  "getTeamBySlug:v2",
  ["teams", "players"],
  3600,
)
