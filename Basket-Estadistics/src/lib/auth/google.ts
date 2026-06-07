import { OAuth2Client } from "google-auth-library"
import { getServerEnv } from "@/lib/env"
import { randomBytes, timingSafeEqual } from "node:crypto"

const STATE_COOKIE = "ghs_oauth_state"
const STATE_TTL_MS = 10 * 60 * 1000

export type GoogleProfile = {
  sub: string
  email: string
  emailVerified: boolean
  name: string
  picture?: string
}

export function isGoogleConfigured(): boolean {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } =
    getServerEnv()
  return Boolean(
    GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET && GOOGLE_REDIRECT_URI,
  )
}

function buildClient(): OAuth2Client {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } =
    getServerEnv()
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
    throw new Error(
      "Google OAuth is not configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and GOOGLE_REDIRECT_URI.",
    )
  }
  return new OAuth2Client(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI,
  )
}

export function buildAuthUrl(state: string): string {
  const client = buildClient()
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "select_account",
    scope: ["openid", "email", "profile"],
    state,
  })
}

export function newOauthState(): string {
  return randomBytes(24).toString("hex")
}

export function verifyOauthState(
  expected: string | undefined | null,
  received: string | undefined | null,
): boolean {
  if (!expected || !received) return false
  if (expected.length !== received.length) return false
  const a = Buffer.from(expected)
  const b = Buffer.from(received)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

export function buildStateCookie(state: string): string {
  const parts = [
    `${STATE_COOKIE}=${state}`,
    "Path=/api/auth/google",
    `Max-Age=${Math.floor(STATE_TTL_MS / 1000)}`,
    "HttpOnly",
    "SameSite=Lax",
  ]
  if (process.env.NODE_ENV === "production") {
    parts.push("Secure")
  }
  return parts.join("; ")
}

export function buildClearStateCookie(): string {
  const parts = [
    `${STATE_COOKIE}=`,
    "Path=/api/auth/google",
    "Max-Age=0",
    "HttpOnly",
    "SameSite=Lax",
  ]
  if (process.env.NODE_ENV === "production") {
    parts.push("Secure")
  }
  return parts.join("; ")
}

export function parseStateCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null
  for (const p of cookieHeader.split(/;\s*/)) {
    const eq = p.indexOf("=")
    if (eq === -1) continue
    if (p.slice(0, eq).trim() === STATE_COOKIE) return p.slice(eq + 1)
  }
  return null
}

export async function exchangeCodeForProfile(
  code: string,
): Promise<GoogleProfile> {
  const client = buildClient()
  const { tokens } = await client.getToken(code)
  if (!tokens.id_token) {
    throw new Error("Google did not return an id_token.")
  }
  const ticket = await client.verifyIdToken({
    idToken: tokens.id_token,
    audience: getServerEnv().GOOGLE_CLIENT_ID,
  })
  const payload = ticket.getPayload()
  if (!payload) {
    throw new Error("Could not verify Google id_token.")
  }
  if (!payload.sub || !payload.email) {
    throw new Error("Google profile is missing required fields.")
  }
  if (payload.email_verified === false) {
    throw new Error("Google email is not verified.")
  }
  return {
    sub: payload.sub,
    email: payload.email.toLowerCase(),
    emailVerified: payload.email_verified ?? false,
    name: payload.name || payload.email.split("@")[0] || "Google user",
    picture: payload.picture,
  }
}
