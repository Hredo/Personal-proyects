import { NextResponse } from "next/server"
import { z } from "zod"
import { SITE } from "@/lib/site"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const Body = z.object({
  name: z.string().trim().min(1, "Name is required.").max(100),
  email: z
    .string()
    .trim()
    .min(3)
    .max(254)
    .email("Please enter a valid email address."),
  subject: z.string().trim().min(1, "Subject is required.").max(200),
  message: z.string().trim().min(1, "Message is required.").max(5000),
  hp: z.string().max(0).optional(),
})

export async function POST(req: Request) {
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

  const { name, email, subject, message } = parsed.data
  const apiKey = process.env.RESEND_API_KEY

  if (!apiKey) {
    console.info(
      `[contact] (no RESEND_API_KEY) message from ${name} <${email}>: ${subject}`,
    )
    return NextResponse.json(
      { ok: true, sent: false },
      { status: 200 },
    )
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Contact Form <onboarding@resend.dev>",
        to: [SITE.contact],
        replyTo: email,
        subject: `[${SITE.name}] ${subject}`,
        text: [
          `New contact message via ${SITE.url}.`,
          ``,
          `From: ${name} <${email}>`,
          `Subject: ${subject}`,
          ``,
          message,
        ].join("\n"),
      }),
    })

    if (!res.ok) {
      const text = await res.text().catch(() => "")
      console.warn(
        `[contact] resend failed: ${res.status} ${text.slice(0, 200)}`,
      )
      return NextResponse.json(
        { ok: false, error: "Could not send your message. Please try again." },
        { status: 500 },
      )
    }

    return NextResponse.json({ ok: true, sent: true }, { status: 200 })
  } catch (err) {
    console.warn("[contact] resend fetch failed", err)
    return NextResponse.json(
      { ok: false, error: "Could not send your message. Please try again." },
      { status: 500 },
    )
  }
}
