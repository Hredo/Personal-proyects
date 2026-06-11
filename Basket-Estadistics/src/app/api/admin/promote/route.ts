import { NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { getDb } from "@/lib/db/client"
import { users } from "@/lib/db/schema"
import { getCurrentUser } from "@/lib/auth/current-user"

export async function POST(request: Request) {
  const user = await getCurrentUser(request.headers.get("cookie"))
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const db = getDb()
  await db.update(users).set({ role: "admin" }).where(eq(users.id, user.id))

  return NextResponse.json({ ok: true })
}
