import { NextResponse } from "next/server"
import { eq, asc } from "drizzle-orm"
import { getDb } from "@/lib/db/client"
import { users } from "@/lib/db/schema"
import { getCurrentUser, isAdmin } from "@/lib/auth/current-user"

export async function GET(request: Request) {
  const user = await getCurrentUser(request.headers.get("cookie"))
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!isAdmin(user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const db = getDb()
  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      plan: users.plan,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(asc(users.createdAt))

  return NextResponse.json(rows)
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser(request.headers.get("cookie"))
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!isAdmin(user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = (await request.json()) as {
    userId: string
    role?: string
    plan?: string
  }

  if (!body.userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 })
  }

  const db = getDb()
  const updateData: Record<string, string> = {}
  if (body.role) updateData.role = body.role
  if (body.plan) updateData.plan = body.plan

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 })
  }

  await db.update(users).set(updateData).where(eq(users.id, body.userId))

  return NextResponse.json({ ok: true })
}
