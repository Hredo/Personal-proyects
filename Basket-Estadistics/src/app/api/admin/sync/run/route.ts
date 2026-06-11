import { NextResponse } from "next/server"
import { getCurrentUser, isAdmin } from "@/lib/auth/current-user"
import { SOURCES } from "@/lib/sources"
import { runSync } from "@/lib/sync/run"

export async function POST(request: Request) {
  const user = await getCurrentUser(request.headers.get("cookie"))
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!isAdmin(user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = (await request.json().catch(() => ({}))) as { source?: string }
  const source = body.source

  if (!source) {
    return NextResponse.json({ error: "source is required" }, { status: 400 })
  }

  const adapter = SOURCES[source as keyof typeof SOURCES]
  if (!adapter) {
    return NextResponse.json({ error: `Unknown source: ${source}` }, { status: 400 })
  }

  const result = await runSync(adapter)

  return NextResponse.json(result)
}
