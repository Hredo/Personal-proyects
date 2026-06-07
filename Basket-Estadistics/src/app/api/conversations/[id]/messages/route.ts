import { NextResponse } from "next/server"
import { and, eq } from "drizzle-orm"
import { getDb } from "@/lib/db/client"
import { conversations, messages } from "@/lib/db/schema"
import { getCurrentUser } from "@/lib/auth/current-user"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
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
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 })
  }
  const role = "role" in body ? body.role : null
  const content = "content" in body ? body.content : null
  const model = "model" in body && typeof body.model === "string" ? body.model : null
  const mode = "mode" in body && typeof body.mode === "string" ? body.mode : null
  if (role !== "user" && role !== "assistant") {
    return NextResponse.json({ error: "Invalid role." }, { status: 400 })
  }
  if (typeof content !== "string" || content.length === 0 || content.length > 8000) {
    return NextResponse.json({ error: "Invalid content." }, { status: 400 })
  }

  const db = getDb()
  const owns = await db
    .select({ id: conversations.id })
    .from(conversations)
    .where(and(eq(conversations.id, id), eq(conversations.userId, user.id)))
    .limit(1)
  if (owns.length === 0) {
    return NextResponse.json({ error: "Not found." }, { status: 404 })
  }

  const msgId = crypto.randomUUID()
  await db.insert(messages).values({
    id: msgId,
    conversationId: id,
    role,
    content,
    model,
    mode,
  })
  await db
    .update(conversations)
    .set({ updatedAt: new Date() })
    .where(eq(conversations.id, id))

  return NextResponse.json({ id: msgId })
}
