import { NextResponse } from "next/server"
import { z } from "zod"
import { sql } from "drizzle-orm"
import { getDb } from "@/lib/db/client"
import { SITE } from "@/lib/site"
import { clientIp } from "@/lib/security/ai-advisor"
import { consumeRateLimit } from "@/lib/security/rate-limit"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const Body = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(3)
    .max(254)
    .email("Please enter a valid email address."),
  source: z.string().trim().max(64).optional(),
  hp: z.string().max(0).optional(),
})

const NOTIFY_TO = SITE.contact
const NOTIFY_FROM = "waitlist@globalhoopstats.com"

export async function POST(req: Request) {
  const limited = await consumeRateLimit(
    `waitlist:${clientIp(req)}`,
    5,
    10 * 60 * 1000,
  )
  if (!limited.ok) {
    return NextResponse.json(
      { ok: false, error: "Too many requests. Please try again later." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } },
    )
  }

  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body." },
      { status: 400 },
    )
  }

  const parsed = Body.safeParse(raw)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return NextResponse.json(
      {
        ok: false,
        error: issue?.message ?? "Invalid input.",
        field: issue?.path?.[0] ?? null,
      },
      { status: 400 },
    )
  }

  if (parsed.data.hp) {
    return NextResponse.json({ ok: true, dedup: true }, { status: 200 })
  }

  const { email, source } = parsed.data
  const db = getDb()

  let inserted = false
  let duplicate = false
  try {
    const res = await db.execute(sql`
      insert into waitlist_entries (email, created_at, source)
      values (${email}, ${Math.floor(Date.now() / 1000)}, ${source ?? null})
      on conflict (email) do nothing
    `)
    const rawRes = res as unknown as { count: number }
    const rowCount = rawRes.count ?? 0
    inserted = rowCount > 0
    duplicate = !inserted
  } catch (err) {
    console.error("[waitlist] db insert failed", err)
    return NextResponse.json(
      { ok: false, error: "Could not save your email. Please try again." },
      { status: 500 },
    )
  }

  if (inserted) {
    void notify(email, source)
  }

  return NextResponse.json({ ok: true, dedup: duplicate })
}

async function notify(email: string, source: string | undefined) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.info(
      `[waitlist] (no RESEND_API_KEY) new signup: ${email}${source ? ` (${source})` : ""}`,
    )
    return
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: NOTIFY_FROM,
        to: [NOTIFY_TO],
        subject: `New waitlist signup — ${SITE.name}`,
        text: [
          `New waitlist entry on ${SITE.url}.`,
          ``,
          `Email: ${email}`,
          source ? `Source: ${source}` : null,
          `Time: ${new Date().toISOString()}`,
        ]
          .filter(Boolean)
          .join("\n"),
      }),
    })
    if (!res.ok) {
      const text = await res.text().catch(() => "")
      console.warn(
        `[waitlist] resend notification failed: ${res.status} ${text.slice(0, 200)}`,
      )
    }
  } catch (err) {
    console.warn("[waitlist] resend fetch failed", err)
  }
}
