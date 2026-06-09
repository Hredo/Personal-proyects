/**
 * Server-side plan mutation. Presentation data lives in ./catalog (client-safe).
 *
 * Today the switch is self-serve and free (no payment): setUserPlan just writes
 * the users row. The seam is deliberately small so a future Stripe Checkout
 * flow can replace the body of the upgrade path — create a Checkout session,
 * return its URL, and let a webhook call setUserPlan on
 * `checkout.session.completed` — without touching callers or the UI contract.
 */
import { eq } from "drizzle-orm"
import { getDb } from "@/lib/db/client"
import { users } from "@/lib/db/schema"
import { renewalDate, type PlanId } from "@/lib/billing/catalog"

export type {
  PlanId,
  PlanDef,
} from "@/lib/billing/catalog"
export {
  PLANS,
  PLAN_LIST,
  planPrice,
  renewalDate,
  PRO_PERIOD_DAYS,
} from "@/lib/billing/catalog"

export type PlanChangeResult = {
  plan: PlanId
  proSince: string | null
  planRenewsAt: string | null
}

export async function setUserPlan(
  userId: string,
  target: PlanId,
): Promise<PlanChangeResult> {
  const db = getDb()
  const now = new Date()
  if (target === "pro") {
    const renews = renewalDate(now)
    await db
      .update(users)
      .set({ plan: "pro", proSince: now, planRenewsAt: renews, updatedAt: now })
      .where(eq(users.id, userId))
    return {
      plan: "pro",
      proSince: now.toISOString(),
      planRenewsAt: renews.toISOString(),
    }
  }
  await db
    .update(users)
    .set({ plan: "free", planRenewsAt: null, updatedAt: now })
    .where(eq(users.id, userId))
  return { plan: "free", proSince: null, planRenewsAt: null }
}
