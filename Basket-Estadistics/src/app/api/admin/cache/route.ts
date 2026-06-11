import { NextResponse } from "next/server"
import { revalidateTag } from "next/cache"
import { getCurrentUser, isAdmin } from "@/lib/auth/current-user"

const VALID_TAGS = [
  "teams",
  "players",
  "player-season-stats",
  "leagues",
  "seasons",
  "coaches",
] as const

export async function POST(request: Request) {
  const user = await getCurrentUser(request.headers.get("cookie"))
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!isAdmin(user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = (await request.json().catch(() => ({}))) as { tag?: string }
  const tag = body.tag

  if (!tag) {
    return NextResponse.json({ error: "tag is required" }, { status: 400 })
  }

  if (!(VALID_TAGS as readonly string[]).includes(tag)) {
    return NextResponse.json(
      { error: `Invalid tag. Valid: ${VALID_TAGS.join(", ")}` },
      { status: 400 },
    )
  }

  revalidateTag(tag)

  return NextResponse.json({ ok: true, tag })
}

export async function GET() {
  return NextResponse.json({ tags: VALID_TAGS })
}
