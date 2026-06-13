import { NextResponse } from "next/server"
import { getPlayerBySlug } from "@/lib/data/players"
import { clientIp, cleanLlmOutput } from "@/lib/security/ai-advisor"
import { consumeRateLimit } from "@/lib/security/rate-limit"
import { getCurrentUser } from "@/lib/auth/current-user"
import { resolveEngine } from "@/lib/ai/user-provider"
import { chatComplete } from "@/lib/ai/chat"

export const dynamic = "force-dynamic"

const MAX_SLUG_LEN = 100

type Body = {
  slug?: string
}

function buildPlayerPrompt(
  name: string,
  league: string,
  team: string | null,
  position: string | null,
  season: { seasonName: string; gamesPlayed: number; pointsTotal: number | null; reboundsTotal: number | null; assistsTotal: number | null; stealsTotal: number | null; blocksTotal: number | null; fgPct: number | null; threePct: number | null; ftPct: number | null; per: number | null },
): string {
  const ppg = season.pointsTotal != null && season.gamesPlayed > 0 ? (season.pointsTotal / season.gamesPlayed).toFixed(1) : "N/A"
  const rpg = season.reboundsTotal != null && season.gamesPlayed > 0 ? (season.reboundsTotal / season.gamesPlayed).toFixed(1) : "N/A"
  const apg = season.assistsTotal != null && season.gamesPlayed > 0 ? (season.assistsTotal / season.gamesPlayed).toFixed(1) : "N/A"
  const spg = season.stealsTotal != null && season.gamesPlayed > 0 ? (season.stealsTotal / season.gamesPlayed).toFixed(1) : "N/A"
  const bpg = season.blocksTotal != null && season.gamesPlayed > 0 ? (season.blocksTotal / season.gamesPlayed).toFixed(1) : "N/A"
  const fgp = season.fgPct != null ? `${(season.fgPct * 100).toFixed(1)}%` : "N/A"
  const threep = season.threePct != null ? `${(season.threePct * 100).toFixed(1)}%` : "N/A"
  const ftp = season.ftPct != null ? `${(season.ftPct * 100).toFixed(1)}%` : "N/A"
  const per = season.per != null ? season.per.toFixed(1) : "N/A"

  return [
    `Player: ${name}`,
    `League: ${league}`,
    `Team: ${team ?? "Free agent"}`,
    `Position: ${position ?? "N/A"}`,
    `Season: ${season.seasonName}`,
    `GP: ${season.gamesPlayed}`,
    `Per-game: ${ppg} pts / ${rpg} reb / ${apg} ast / ${spg} stl / ${bpg} blk`,
    `Shooting: ${fgp} FG / ${threep} 3P / ${ftp} FT`,
    `PER: ${per}`,
    "",
    "Write a 2-3 sentence scouting report about this player. Mention their role, strenghts, weaknesses, and what kind of team they fit best. Plain prose, no lists, no markdown. Write in Spanish.",
  ].join("\n")
}

export async function POST(request: Request) {
  const ip = clientIp(request)
  const limit = await consumeRateLimit(`ai:${ip}`, 30, 5 * 60 * 1000)
  if (!limit.ok) {
    return NextResponse.json(
      {
        error: `Too many requests. Try again in ${limit.retryAfterSec}s.`,
      },
      {
        status: 429,
        headers: { "Retry-After": String(limit.retryAfterSec) },
      },
    )
  }

  let body: Body
  try {
    body = (await request.json()) as Body
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 })
  }

  const slug = body.slug?.trim()
  if (!slug) {
    return NextResponse.json(
      { error: "Missing player slug." },
      { status: 400 },
    )
  }
  if (slug.length > MAX_SLUG_LEN) {
    return NextResponse.json(
      { error: "Slug too long." },
      { status: 400 },
    )
  }

  const profile = await getPlayerBySlug(slug)
  if (!profile) {
    return NextResponse.json(
      { error: "Player not found." },
      { status: 404 },
    )
  }

  try {
    let analysis: string | null = null
    let aiProvider: string | null = null
    let aiConfigured = false
    let aiReason: string | null = null

    const user = await getCurrentUser(request.headers.get("cookie"))
    if (user) {
      const engine = await resolveEngine(user.id, "compare")
      if (engine.ok) {
        aiConfigured = true
        const season = profile.seasons[0] ?? null
        if (season) {
          const llm = await chatComplete({
            provider: engine.provider,
            model: engine.model,
            apiKey: engine.apiKey,
            system:
              "You are a concise basketball scout. Given a player's stats, write a short scouting report in Spanish. Plain prose, no lists, no markdown.",
            messages: [
              {
                role: "user",
                content: buildPlayerPrompt(
                  profile.fullName,
                  profile.league.name,
                  profile.team?.name ?? null,
                  profile.position,
                  season,
                ),
              },
            ],
            maxTokens: 300,
            temperature: 0.5,
          })
          if (llm.ok) {
            analysis = cleanLlmOutput(llm.content)
            aiProvider = engine.provider.id
          } else {
            aiReason = "ai_error"
          }
        }
      } else {
        aiReason = engine.reason
      }
    }

    return NextResponse.json({ analysis, aiProvider, aiConfigured, aiReason })
  } catch (error) {
    console.error("players/ai error:", error)
    return NextResponse.json(
      { error: "Could not generate the analysis." },
      { status: 500 },
    )
  }
}
