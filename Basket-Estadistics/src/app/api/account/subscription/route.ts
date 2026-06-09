import { NextResponse } from "next/server"
import { z } from "zod"
import { getCurrentUser } from "@/lib/auth/current-user"
import { setUserPlan } from "@/lib/billing/plans"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const schema = z.object({
  plan: z.enum(["free", "pro"]),
})

export async function POST(request: Request) {
  const user = await getCurrentUser(request.headers.get("cookie"))
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 })
  }
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 })
  }
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid plan." }, { status: 400 })
  }

  // Self-serve switch, no payment yet. When Stripe lands, an upgrade should
  // instead create a Checkout session and return { checkoutUrl }; the webhook
  // calls setUserPlan on completion. Downgrades can stay immediate.
  const result = await setUserPlan(user.id, parsed.data.plan)
  return NextResponse.json({ ok: true, ...result })
}
