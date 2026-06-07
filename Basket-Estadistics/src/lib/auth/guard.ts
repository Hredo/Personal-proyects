import { NextResponse } from "next/server"
import {
  getCurrentUser,
  isPro,
  type SessionUser,
} from "@/lib/auth/current-user"

export type GateResult =
  | { ok: true; user: SessionUser }
  | { ok: false; response: NextResponse }

function unauthorized(): NextResponse {
  return NextResponse.json(
    { error: "Authentication required." },
    { status: 401 },
  )
}

function forbidden(): NextResponse {
  return NextResponse.json(
    { error: "This action requires a Pro plan." },
    { status: 403 },
  )
}

export async function requireUser(
  request: Request,
): Promise<GateResult> {
  const cookieHeader = request.headers.get("cookie")
  const user = await getCurrentUser(cookieHeader)
  if (!user) return { ok: false, response: unauthorized() }
  return { ok: true, user }
}

export async function requirePro(
  request: Request,
): Promise<GateResult> {
  const result = await requireUser(request)
  if (!result.ok) return result
  if (!isPro(result.user)) return { ok: false, response: forbidden() }
  return result
}
