import { and, asc, desc, eq, like, sql } from "drizzle-orm"
import { getDb } from "@/lib/db/client"
import { leagues, players, teams } from "@/lib/db/schema"

export type TeamListItem = {
  id: string
  name: string
  slug: string
  logoUrl: string | null
  country: string | null
  league: { id: string; name: string; slug: string; country: string }
  playerCount: number
}

export type ListTeamsInput = {
  query?: string
  league?: string
  sort?: "name" | "players"
  order?: "asc" | "desc"
  limit?: number
}

export async function listTeams(
  input: ListTeamsInput = {},
): Promise<TeamListItem[]> {
  const db = getDb()
  const limit = input.limit ?? 200
  const order = input.order ?? "asc"
  const sort = input.sort ?? "name"

  const conditions = []
  if (input.league) conditions.push(eq(leagues.slug, input.league))
  if (input.query) {
    const q = `%${input.query.toLowerCase()}%`
    conditions.push(like(sql`lower(${teams.name})`, q))
  }
  const where = conditions.length ? and(...conditions) : undefined

  const playerCountExpr = sql<number>`(
    select count(*) from ${players} where ${players.currentTeamId} = ${teams.id}
  )`

  const orderExpr = (() => {
    const dir = order === "asc" ? asc : desc
    if (sort === "players") return dir(sql`coalesce(${playerCountExpr}, 0)`)
    return dir(teams.name)
  })()

  const rows = await db
    .select({
      id: teams.id,
      name: teams.name,
      slug: teams.slug,
      logoUrl: teams.logoUrl,
      country: teams.country,
      leagueId: leagues.id,
      leagueName: leagues.name,
      leagueSlug: leagues.slug,
      leagueCountry: leagues.country,
      playerCount: playerCountExpr,
    })
    .from(teams)
    .innerJoin(leagues, eq(teams.leagueId, leagues.id))
    .where(where)
    .orderBy(orderExpr)
    .limit(limit)

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    logoUrl: r.logoUrl,
    country: r.country,
    league: {
      id: r.leagueId,
      name: r.leagueName,
      slug: r.leagueSlug,
      country: r.leagueCountry,
    },
    playerCount: Number(r.playerCount ?? 0),
  }))
}

export type TeamOption = { id: string; name: string; slug: string; leagueSlug: string }

export async function listTeamOptions(limit = 300): Promise<TeamOption[]> {
  const db = getDb()
  const rows = await db
    .select({
      id: teams.id,
      name: teams.name,
      slug: teams.slug,
      leagueSlug: leagues.slug,
    })
    .from(teams)
    .innerJoin(leagues, eq(teams.leagueId, leagues.id))
    .orderBy(asc(teams.name))
    .limit(limit)
  return rows
}
