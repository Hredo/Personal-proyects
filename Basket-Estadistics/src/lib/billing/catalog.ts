/**
 * Plan presentation data. Pure and client-safe (no DB imports) so both the
 * server (plans.ts) and client panels can share one source of truth.
 */

export type PlanId = "free" | "pro"

export type PlanDef = {
  id: PlanId
  name: string
  priceMonthly: number
  currency: string
  tagline: string
  features: string[]
}

export const PRO_PERIOD_DAYS = 30

export const PLANS: Record<PlanId, PlanDef> = {
  free: {
    id: "free",
    name: "Free",
    priceMonthly: 0,
    currency: "EUR",
    tagline: "Explore every player, team and coach across all leagues.",
    features: [
      "Full player, team & coach database",
      "Cross-league stats and profiles",
      "1 AI Advisor preview conversation",
      "1 AI player comparison",
      "Bring your own AI key or local model",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    priceMonthly: 9,
    currency: "EUR",
    tagline: "Unlimited AI scouting with your own model.",
    features: [
      "Everything in Free",
      "Unlimited AI Advisor conversations",
      "Unlimited AI comparisons",
      "Saved conversation history",
      "PDF / Excel / Word exports",
      "Priority support",
    ],
  },
}

export const PLAN_LIST: PlanDef[] = [PLANS.free, PLANS.pro]

export function planPrice(id: PlanId): string {
  const p = PLANS[id]
  if (p.priceMonthly === 0) return "Free"
  return `€${p.priceMonthly}/mo`
}

export function renewalDate(from: Date = new Date()): Date {
  return new Date(from.getTime() + PRO_PERIOD_DAYS * 24 * 60 * 60 * 1000)
}
