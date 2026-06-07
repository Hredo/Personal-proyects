import { NextResponse } from "next/server"
import {
  buildAuthUrl,
  buildStateCookie,
  isGoogleConfigured,
  newOauthState,
} from "@/lib/auth/google"
import { safeNextPath } from "@/lib/auth/safe-redirect"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  if (!isGoogleConfigured()) {
    return NextResponse.json(
      {
        error:
          "Google Sign-In is not configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and GOOGLE_REDIRECT_URI in .env.local.",
      },
      { status: 503 },
    )
  }
  const url = new URL(request.url)
  const next = safeNextPath(url.searchParams.get("next"))
  const state = newOauthState()
  const authUrl = buildAuthUrl(state)
  const res = NextResponse.redirect(authUrl, { status: 302 })
  res.headers.append(
    "Set-Cookie",
    buildStateCookie(`${state}|${encodeURIComponent(next)}`),
  )
  return res
}
