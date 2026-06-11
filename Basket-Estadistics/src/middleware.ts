import { NextResponse, type NextRequest } from "next/server"
import {
  parseSessionCookie,
  verifySessionToken,
} from "@/lib/auth/session"

export const config = {
  matcher: [
    "/ai-advisor/:path*",
    "/account/:path*",
    "/api/ai-advisor/:path*",
    "/api/conversations/:path*",
    "/api/compare/ai/:path*",
    "/api/account/:path*",
    "/api/admin/:path*",
    "/admin/:path*",
  ],
  runtime: "nodejs",
}

const PROTECTED_PREFIXES = [
  "/ai-advisor",
  "/account",
  "/api/ai-advisor",
  "/api/conversations",
  "/api/compare/ai",
  "/api/account",
  "/api/admin",
  "/admin",
]

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  )
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  if (!isProtected(pathname)) return NextResponse.next()

  const cookieHeader = request.headers.get("cookie")
  const token = parseSessionCookie(cookieHeader)
  const verified = token ? verifySessionToken(token) : null

  if (!verified) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 },
      )
    }
    const url = request.nextUrl.clone()
    const next = pathname + (request.nextUrl.search ?? "")
    url.pathname = "/login"
    url.search = `?next=${encodeURIComponent(next)}`
    return NextResponse.redirect(url)
  }
  return NextResponse.next()
}
