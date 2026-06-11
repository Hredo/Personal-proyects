import { NextResponse } from "next/server"
import { z } from "zod"
import { and, desc, eq } from "drizzle-orm"
import { getDb } from "@/lib/db/client"
import { conversations } from "@/lib/db/schema"
import { getCurrentUser } from "@/lib/auth/current-user"
// NOTE: Import kept for when usage limits are re-enabled.
// import { getAdvisorFreeUsage } from "@/lib/auth/free-usage"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const createSchema = z.object({
  teamSlug: z.string().trim().min(1).max(120),
  teamName: z.string().trim().min(1).max(120),
  leagueSlug: z.string().trim().min(1).max(60),
  title: z.string().trim().min(1).max(160),
})

export async function GET(request: Request) {
  const user = await getCurrentUser(request.headers.get("cookie"))
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 })
  }
  const db = getDb()
  const rows = await db
    .select({
      id: conversations.id,
      teamSlug: conversations.teamSlug,
      teamName: conversations.teamName,
      leagueSlug: conversations.leagueSlug,
      title: conversations.title,
      createdAt: conversations.createdAt,
      updatedAt: conversations.updatedAt,
    })
    .from(conversations)
    .where(eq(conversations.userId, user.id))
    .orderBy(desc(conversations.updatedAt))
    .limit(200)
  return NextResponse.json({ conversations: rows })
}

export async function POST(request: Request) {
  const user = await getCurrentUser(request.headers.get("cookie"))
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 })
  }
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 })
  }
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid conversation payload." },
      { status: 400 },
    )
  }
  // NOTE: Free quota check disabled until re-enabled later.
  // const usage = await getAdvisorFreeUsage(user.id, user.plan, user.role)
  // if (usage.remaining <= 0 && usage.limit !== Infinity) {
  //   return NextResponse.json(
  //     {
  //       error: "free_quota_exceeded",
  //       message:
  //         "You used your free advisor preview. Upgrade to Pro for unlimited conversations.",
  //     },
  //     { status: 403 },
  //   )
  // }
  const db = getDb()
  const id = crypto.randomUUID()
  const now = new Date()
  await db.insert(conversations).values({
    id,
    userId: user.id,
    teamSlug: parsed.data.teamSlug,
    teamName: parsed.data.teamName,
    leagueSlug: parsed.data.leagueSlug,
    title: parsed.data.title,
    createdAt: now,
    updatedAt: now,
  })
  return NextResponse.json({ id })
}

export async function DELETE(request: Request) {
  const user = await getCurrentUser(request.headers.get("cookie"))
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 })
  }
  const url = new URL(request.url)
  const id = url.searchParams.get("id")
  if (!id) {
    return NextResponse.json({ error: "Missing id." }, { status: 400 })
  }
  const db = getDb()
  await db
    .delete(conversations)
    .where(and(eq(conversations.id, id), eq(conversations.userId, user.id)))
  return NextResponse.json({ ok: true })
}
