import { NextResponse } from "next/server"
import { and, asc, eq, like, sql } from "drizzle-orm"
import { getDb } from "@/lib/db/client"
import { leagues, playerSeasonStats, players, teams } from "@/lib/db/schema"
import { rateLimit, clientIp } from "@/lib/security/ai-advisor"

export const dynamic = "force-dynamic"

const LEAGUES = new Set(["nba", "euroleague", "acb"])
const MAX_QUERY_LEN = 100
const MAX_LEAGUE_LEN = 32

type Row = {
  id: string
  slug: string
  fullName: string
  source: string
  photoUrl: string | null
  position: string | null
  nationality: string | null
  teamId: string | null
  teamName: string | null
  teamSlug: string | null
  teamLogo: string | null
  leagueId: string
  leagueName: string
  leagueSlug: string
  leagueCountry: string
}

export async function GET(req: Request) {
  const ip = clientIp(req)
  const limit = rateLimit(ip)
  if (!limit.ok) {
    return NextResponse.json(
      {
        error: `Demasiadas solicitudes. Intenta de nuevo en ${limit.retryAfterSec}s.`,
      },
      {
        status: 429,
        headers: { "Retry-After": String(limit.retryAfterSec) },
      },
    )
  }

  const url = new URL(req.url)
  const q = url.searchParams.get("q")?.trim() ?? ""
  const league = url.searchParams.get("league")?.trim() ?? ""
  const rawLimit = Number(url.searchParams.get("limit") ?? 12)
  const limitNum = Math.min(
    Math.max(Number.isFinite(rawLimit) ? rawLimit : 12, 1),
    30,
  )

  if (q.length > MAX_QUERY_LEN || league.length > MAX_LEAGUE_LEN) {
    return NextResponse.json(
      { error: "Parámetros demasiado largos." },
      { status: 400 },
    )
  }

  const db = getDb()
  const conditions = []
  if (q) {
    conditions.push(
      like(sql`lower(${players.firstName} || ' ' || ${players.lastName})`, `%${q.toLowerCase()}%`),
    )
  }
  if (LEAGUES.has(league)) {
    conditions.push(eq(leagues.slug, league))
  }
  const where = conditions.length ? and(...conditions) : undefined

  const rows: Row[] = await db
    .select({
      id: players.id,
      slug: players.slug,
      fullName: sql<string>`${players.firstName} || ' ' || ${players.lastName}`,
      source: leagues.slug,
      photoUrl: players.imageUrl,
      position: players.position,
      nationality: players.nationality,
      teamId: teams.id,
      teamName: teams.name,
      teamSlug: teams.slug,
      teamLogo: teams.logoUrl,
      leagueId: leagues.id,
      leagueName: leagues.name,
      leagueSlug: leagues.slug,
      leagueCountry: leagues.region,
    })
    .from(players)
    .innerJoin(playerSeasonStats, eq(playerSeasonStats.playerId, players.id))
    .innerJoin(leagues, eq(playerSeasonStats.leagueId, leagues.id))
    .leftJoin(teams, eq(playerSeasonStats.teamId, teams.id))
    .where(where)
    .orderBy(asc(sql`${players.firstName} || ' ' || ${players.lastName}`))
    .limit(limitNum)

  const ranked = q ? rankByQuery(rows, q.toLowerCase()) : rows

  return NextResponse.json({
    results: ranked.map((r) => ({
      id: r.id,
      slug: r.slug,
      fullName: r.fullName,
      source: r.source,
      photoUrl: r.photoUrl,
      position: r.position,
      nationality: r.nationality,
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
    })),
    q,
    league: LEAGUES.has(league) ? league : null,
  })
}

function rankByQuery(rows: Row[], q: string) {
  const score = (r: Row) => {
    const name = r.fullName.toLowerCase()
    if (name === q) return 0
    if (name.startsWith(q)) return 1
    const lastName = name.split(" ").slice(-1)[0] ?? name
    if (lastName.startsWith(q)) return 2
    if (name.includes(" " + q)) return 3
    if (name.includes(q)) return 4
    return 5
  }
  return [...rows].sort((a, b) => score(a) - score(b))
}
