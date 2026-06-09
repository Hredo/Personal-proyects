import { NextResponse } from "next/server"
import { z } from "zod"
import { and, eq, ne } from "drizzle-orm"
import { getDb } from "@/lib/db/client"
import { users } from "@/lib/db/schema"
import { getCurrentUser, planLabel } from "@/lib/auth/current-user"
import { userPlan } from "@/lib/db/schema"
import {
  getAdvisorFreeUsage,
  getCompareFreeUsage,
  type FreeUsage,
} from "@/lib/auth/free-usage"
import { getUserSettings } from "@/lib/ai/user-provider"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function serializeUsage(u: FreeUsage) {
  const unlimited = !Number.isFinite(u.limit)
  return {
    count: u.count,
    limit: unlimited ? null : u.limit,
    remaining: unlimited ? null : u.remaining,
    unlimited,
  }
}

export async function GET(request: Request) {
  const sessionUser = await getCurrentUser(request.headers.get("cookie"))
  if (!sessionUser) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 })
  }
  const db = getDb()
  const rows = await db
    .select({
      name: users.name,
      email: users.email,
      createdAt: users.createdAt,
      proSince: users.proSince,
      planRenewsAt: users.planRenewsAt,
    })
    .from(users)
    .where(eq(users.id, sessionUser.id))
    .limit(1)
  const row = rows[0]
  if (!row) {
    return NextResponse.json({ error: "Account not found." }, { status: 404 })
  }

  const plan = userPlan(sessionUser)
  const [advisor, compare, settings] = await Promise.all([
    getAdvisorFreeUsage(sessionUser.id, sessionUser.plan, sessionUser.role),
    getCompareFreeUsage(sessionUser.id, sessionUser.plan, sessionUser.role),
    getUserSettings(sessionUser.id),
  ])

  return NextResponse.json({
    profile: {
      name: row.name,
      email: row.email,
      plan,
      planLabel: planLabel(plan),
      role: sessionUser.role,
      createdAt: row.createdAt.toISOString(),
      proSince: row.proSince ? row.proSince.toISOString() : null,
      planRenewsAt: row.planRenewsAt ? row.planRenewsAt.toISOString() : null,
    },
    usage: {
      advisor: serializeUsage(advisor),
      compare: serializeUsage(compare),
    },
    settings,
  })
}

const patchSchema = z.object({
  name: z.string().trim().min(2).max(60).optional(),
  email: z.string().trim().toLowerCase().email().max(254).optional(),
})

export async function PATCH(request: Request) {
  const sessionUser = await getCurrentUser(request.headers.get("cookie"))
  if (!sessionUser) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 })
  }
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 })
  }
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid profile data." }, { status: 400 })
  }
  const { name, email } = parsed.data
  if (name === undefined && email === undefined) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 })
  }

  const db = getDb()
  if (email && email !== sessionUser.email.toLowerCase()) {
    const clash = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.email, email), ne(users.id, sessionUser.id)))
      .limit(1)
    if (clash.length > 0) {
      return NextResponse.json(
        { error: "That email is already in use." },
        { status: 409 },
      )
    }
  }

  const update: Record<string, unknown> = { updatedAt: new Date() }
  if (name !== undefined) update.name = name
  if (email !== undefined) update.email = email
  await db.update(users).set(update).where(eq(users.id, sessionUser.id))

  return NextResponse.json({
    ok: true,
    name: name ?? sessionUser.name,
    email: email ?? sessionUser.email,
  })
}
