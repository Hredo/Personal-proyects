import { NextResponse } from "next/server"
import { and, asc, eq } from "drizzle-orm"
import { getDb } from "@/lib/db/client"
import { conversations, messages } from "@/lib/db/schema"
import { getCurrentUser } from "@/lib/auth/current-user"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_request: Request, context: RouteContext) {
  const user = await getCurrentUser(_request.headers.get("cookie"))
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 })
  }
  const { id } = await context.params
  if (!id || id.length > 60) {
    return NextResponse.json({ error: "Invalid id." }, { status: 400 })
  }
  const db = getDb()
  const conv = await db
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
    .where(and(eq(conversations.id, id), eq(conversations.userId, user.id)))
    .limit(1)
  if (conv.length === 0) {
    return NextResponse.json({ error: "Not found." }, { status: 404 })
  }
  const msgs = await db
    .select({
      id: messages.id,
      role: messages.role,
      content: messages.content,
      model: messages.model,
      mode: messages.mode,
      createdAt: messages.createdAt,
    })
    .from(messages)
    .where(eq(messages.conversationId, id))
    .orderBy(asc(messages.createdAt))
  return NextResponse.json({ conversation: conv[0], messages: msgs })
}

export async function PATCH(request: Request, context: RouteContext) {
  const user = await getCurrentUser(request.headers.get("cookie"))
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 })
  }
  const { id } = await context.params
  if (!id || id.length > 60) {
    return NextResponse.json({ error: "Invalid id." }, { status: 400 })
  }
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 })
  }
  const title =
    body && typeof body === "object" && "title" in body && typeof body.title === "string"
      ? body.title.trim().slice(0, 160)
      : null
  if (!title) {
    return NextResponse.json({ error: "Missing title." }, { status: 400 })
  }
  const db = getDb()
  await db
    .update(conversations)
    .set({ title, updatedAt: new Date() })
    .where(and(eq(conversations.id, id), eq(conversations.userId, user.id)))
  return NextResponse.json({ ok: true })
}
