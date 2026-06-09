import { NextResponse } from "next/server"
import { getPlayerForCompare } from "@/lib/data/compare"
import { comparePlayers } from "@/lib/ai/player-comparator"
import { rateLimit, clientIp } from "@/lib/security/ai-advisor"

export const dynamic = "force-dynamic"

const MAX_SLUG_LEN = 100

type Body = {
  aSlug?: string
  bSlug?: string
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

  try {
    const result = comparePlayers(a, b)
    return NextResponse.json({ data: result })
  } catch (error) {
    console.error("compare/ai error:", error)
    return NextResponse.json(
      { error: "Could not generate the analysis." },
      { status: 500 },
    )
  }

}
