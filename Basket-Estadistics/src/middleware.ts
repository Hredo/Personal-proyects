import { NextResponse, type NextRequest } from "next/server"
import {
  parseSessionCookie,
  verifySessionToken,
} from "@/lib/auth/session"
import { SITE } from "@/lib/site"

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
    "/api/:path*",
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

const API_PREFIXES = [
  "/api/",
]

const ALLOWED_ORIGINS: string[] = (() => {
  const origins = [SITE.url]
  if (process.env.NODE_ENV === "development") {
    origins.push("http://localhost:3000")
  }
  const envOrigin = process.env.NEXT_PUBLIC_SITE_URL
  if (envOrigin && !origins.includes(envOrigin)) {
    origins.push(envOrigin)
  }
  return origins
})()

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  )
}

function isApiRoute(pathname: string): boolean {
  return API_PREFIXES.some((p) => pathname.startsWith(p))
}

function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return true
  return ALLOWED_ORIGINS.some(
    (allowed) =>
      origin === allowed ||
      origin === allowed.replace(/\/$/, ""),
  )
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const origin = request.headers.get("origin")

  // ── CORS ──────────────────────────────────────────────
  const corsHeaders: Record<string, string> = {}

  if (origin && isApiRoute(pathname)) {
    if (isOriginAllowed(origin)) {
      corsHeaders["Access-Control-Allow-Origin"] = origin
      corsHeaders["Access-Control-Allow-Methods"] =
        "GET, POST, PUT, PATCH, DELETE, OPTIONS"
      corsHeaders["Access-Control-Allow-Headers"] =
        "Content-Type, Authorization, Cookie"
      corsHeaders["Access-Control-Allow-Credentials"] = "true"
      corsHeaders["Access-Control-Max-Age"] = "86400"
    } else {
      corsHeaders["Access-Control-Allow-Origin"] = "null"
    }
  }

  // Handle OPTIONS preflight
  if (request.method === "OPTIONS" && origin && isApiRoute(pathname)) {
    if (isOriginAllowed(origin)) {
      return new NextResponse(null, {
        status: 204,
        headers: corsHeaders,
      })
    }
    return new NextResponse(null, { status: 204 })
  }

  // ── Auth guard ────────────────────────────────────────
  if (!isProtected(pathname)) {
    const response = NextResponse.next()
    for (const [key, value] of Object.entries(corsHeaders)) {
      if (value) response.headers.set(key, value)
    }
    return response
  }

  const cookieHeader = request.headers.get("cookie")
  const token = parseSessionCookie(cookieHeader)
  const verified = token ? verifySessionToken(token) : null

  if (!verified) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401, headers: corsHeaders },
      )
    }
    const url = request.nextUrl.clone()
    const next = pathname + (request.nextUrl.search ?? "")
    url.pathname = "/login"
    url.search = `?next=${encodeURIComponent(next)}`
    return NextResponse.redirect(url)
  }

  const response = NextResponse.next()
  for (const [key, value] of Object.entries(corsHeaders)) {
    if (value) response.headers.set(key, value)
  }
  return response
}
