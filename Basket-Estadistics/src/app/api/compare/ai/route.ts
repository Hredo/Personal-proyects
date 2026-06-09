import { NextResponse } from "next/server"
import { getPlayerForCompare } from "@/lib/data/compare"
import {
  comparePlayers,
  type ComparisonOutput,
} from "@/lib/ai/player-comparator"
import { rateLimit, clientIp, cleanLlmOutput } from "@/lib/security/ai-advisor"
import { getCurrentUser } from "@/lib/auth/current-user"
import { resolveEngine } from "@/lib/ai/user-provider"
import { chatComplete } from "@/lib/ai/chat"

export const dynamic = "force-dynamic"

const MAX_SLUG_LEN = 100
const MAX_NAME_LEN = 120

type Body = {
  aSlug?: string
  bSlug?: string
  aName?: string
  bName?: string
}

function buildComparePrompt(
  aName: string,
  bName: string,
  r: ComparisonOutput,
): string {
  const cats = r.categories
    .map((c) => {
      const winner =
        c.winner === "a" ? aName : c.winner === "b" ? bName : "tie"
      return `- ${c.label}: ${aName} ${c.formatted.a} vs ${bName} ${c.formatted.b} → ${winner}`
    })
    .join("\n")
  return [
    `Players: ${aName} vs ${bName}`,
    `Overall AI score: ${aName} ${r.overall.aScore.toFixed(1)} — ${bName} ${r.overall.bScore.toFixed(1)} (confidence ${r.overall.confidence})`,
    `Archetypes: ${aName} = ${r.archetype.a}; ${bName} = ${r.archetype.b}`,
    `Category winners:`,
    cats,
    "",
    `Write a 2-3 sentence scouting take on who fits which team better and why. Be specific about role and fit. Plain prose, no lists, no markdown.`,
  ].join("\n")
}

export async function POST(request: Request) {
  const ip = clientIp(request)
  const limit = rateLimit(ip)
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
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 },
    )
  }

  const aSlug = body.aSlug?.trim()
  const bSlug = body.bSlug?.trim()
  if (!aSlug || !bSlug) {
    return NextResponse.json(
      { error: "Missing player slugs." },
      { status: 400 },
    )
  }
  if (aSlug.length > MAX_SLUG_LEN || bSlug.length > MAX_SLUG_LEN) {
    return NextResponse.json(
      { error: "Slug too long." },
      { status: 400 },
    )
  }
  if (aSlug === bSlug) {
    return NextResponse.json(
      { error: "Pick two different players." },
      { status: 400 },
    )
  }

  const [a, b] = await Promise.all([
    getPlayerForCompare(aSlug),
    getPlayerForCompare(bSlug),
  ])

  if (!a) {
    return NextResponse.json(
      { error: `Player "${aSlug}" not found.` },
      { status: 404 },
    )
  }
  if (!b) {
    return NextResponse.json(
      { error: `Player "${bSlug}" not found.` },
      { status: 404 },
    )
  }

  const aName = (body.aName?.trim() || aSlug).slice(0, MAX_NAME_LEN)
  const bName = (body.bName?.trim() || bSlug).slice(0, MAX_NAME_LEN)

  try {
    const result = comparePlayers(a, b)

    // Optional AI take, powered by whatever engine the user picked for Compare.
    // The deterministic breakdown above always renders; this just adds prose.
    let aiSummary: string | null = null
    let aiProvider: string | null = null
    let aiConfigured = false
    let aiReason: string | null = null

    const user = await getCurrentUser(request.headers.get("cookie"))
    if (user) {
      const engine = await resolveEngine(user.id, "compare")
      if (engine.ok) {
        aiConfigured = true
        const llm = await chatComplete({
          provider: engine.provider,
          model: engine.model,
          apiKey: engine.apiKey,
          system:
            "You are a concise basketball scout. Given a structured head-to-head, write a short, specific verdict. No markdown, no lists, plain prose, English.",
          messages: [
            { role: "user", content: buildComparePrompt(aName, bName, result) },
          ],
          maxTokens: 220,
          temperature: 0.5,
        })
        if (llm.ok) {
          aiSummary = cleanLlmOutput(llm.content)
          aiProvider = engine.provider.id
        } else {
          aiReason = "ai_error"
        }
      } else {
        aiReason = engine.reason
      }
    }

    return NextResponse.json({
      data: result,
      aiSummary,
      aiProvider,
      aiConfigured,
      aiReason,
    })
  } catch (error) {
    console.error("compare/ai error:", error)
    return NextResponse.json(
      { error: "Could not generate the analysis." },
      { status: 500 },
    )
  }
}
