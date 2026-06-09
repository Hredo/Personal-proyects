"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { AccountSection, StatusNote } from "@/components/account/primitives"
import { cn } from "@/components/ui/cn"
import { PLAN_LIST, planPrice, type PlanId } from "@/lib/billing/catalog"

type Usage = {
  count: number
  limit: number | null
  remaining: number | null
  unlimited: boolean
}

type Profile = {
  plan: PlanId | "free" | "pro"
  planLabel: string
  role: string
  proSince: string | null
  planRenewsAt: string | null
}

function formatDate(iso: string | null): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export function SubscriptionPanel() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [advisor, setAdvisor] = useState<Usage | null>(null)
  const [compare, setCompare] = useState<Usage | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<PlanId | null>(null)
  const [note, setNote] = useState<{ type: "success" | "error"; msg: string } | null>(
    null,
  )

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/account/profile", { cache: "no-store" })
      if (!res.ok) return
      const data = await res.json()
      setProfile(data.profile)
      setAdvisor(data.usage.advisor)
      setCompare(data.usage.compare)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const isAdmin = profile?.role === "admin"
  const currentPlan: PlanId = profile?.plan === "pro" ? "pro" : "free"

  const changePlan = async (plan: PlanId) => {
    if (busy) return
    setBusy(plan)
    setNote(null)
    try {
      const res = await fetch("/api/account/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setNote({ type: "error", msg: data.error ?? "Could not change plan." })
        return
      }
      setNote({
        type: "success",
        msg: plan === "pro" ? "Welcome to Pro! 🎉" : "Switched to Free.",
      })
      window.dispatchEvent(new Event("auth:changed"))
      await load()
    } catch {
      setNote({ type: "error", msg: "Network error." })
    } finally {
      setBusy(null)
    }
  }

  const renews = formatDate(profile?.planRenewsAt ?? null)

  return (
    <>
      <AccountSection
        title="Your plan"
        description="Switch any time. Upgrades are instant — no card required during the beta."
      >
        {loading ? (
          <div className="h-24 animate-pulse rounded-xl bg-white/[0.04]" />
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-hairline bg-ink-900/40 px-4 py-3.5">
              <div>
                <p className="text-sm text-ink-400">Current plan</p>
                <p className="font-display text-xl font-bold text-ink-50">
                  {profile?.planLabel}
                </p>
              </div>
              {isAdmin ? (
                <span className="text-[12px] text-brand-200">
                  Admin — everything unlocked
                </span>
              ) : currentPlan === "pro" && renews ? (
                <span className="text-[12px] text-ink-400">Renews {renews}</span>
              ) : null}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <UsageMeter label="AI Advisor conversations" usage={advisor} />
              <UsageMeter label="AI comparisons" usage={compare} />
            </div>

            {note ? <StatusNote type={note.type}>{note.msg}</StatusNote> : null}
          </div>
        )}
      </AccountSection>

      <AccountSection title="Plans">
        <div className="grid gap-4 sm:grid-cols-2">
          {PLAN_LIST.map((plan) => {
            const isCurrent = currentPlan === plan.id
            return (
              <div
                key={plan.id}
                className={cn(
                  "flex flex-col rounded-2xl border p-5",
                  plan.id === "pro"
                    ? "border-brand-500/40 bg-brand-500/[0.06]"
                    : "border-hairline bg-ink-900/40",
                )}
              >
                <div className="flex items-baseline justify-between">
                  <h3 className="font-display text-lg font-bold text-ink-50">
                    {plan.name}
                  </h3>
                  <span className="text-sm font-semibold text-ink-200">
                    {planPrice(plan.id)}
                  </span>
                </div>
                <p className="mt-1 text-[13px] text-ink-400">{plan.tagline}</p>

                <ul className="mt-4 flex-1 space-y-2">
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-2 text-[13px] text-ink-200"
                    >
                      <svg
                        className="mt-0.5 h-4 w-4 shrink-0 text-brand-400"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2.2}
                        aria-hidden
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>

                <div className="mt-5">
                  {isCurrent ? (
                    <span className="inline-flex h-10 w-full items-center justify-center rounded-full border border-hairline bg-white/[0.04] text-sm font-semibold text-ink-300">
                      Current plan
                    </span>
                  ) : isAdmin ? (
                    <span className="inline-flex h-10 w-full items-center justify-center rounded-full border border-hairline text-sm text-ink-500">
                      Managed by admin role
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => changePlan(plan.id)}
                      disabled={busy !== null}
                      className={cn(
                        "inline-flex h-10 w-full items-center justify-center rounded-full text-sm font-semibold transition disabled:opacity-60",
                        plan.id === "pro"
                          ? "bg-brand-500 text-ink-950 shadow-[var(--shadow-brand-glow)] hover:bg-brand-400"
                          : "border border-hairline bg-white/[0.04] text-ink-100 hover:bg-white/[0.08]",
                      )}
                    >
                      {busy === plan.id
                        ? "Working…"
                        : plan.id === "pro"
                          ? "Upgrade to Pro"
                          : "Switch to Free"}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        <p className="mt-4 text-[12px] text-ink-500">
          Need to power AI features with your own model?{" "}
          <Link href="/account/ai-keys" className="text-brand-300 hover:underline">
            Connect a provider
          </Link>{" "}
          — works on any plan.
        </p>
      </AccountSection>
    </>
  )
}

function UsageMeter({ label, usage }: { label: string; usage: Usage | null }) {
  if (!usage) {
    return <div className="h-16 animate-pulse rounded-xl bg-white/[0.04]" />
  }
  const pct =
    usage.unlimited || !usage.limit
      ? 0
      : Math.min(100, Math.round((usage.count / usage.limit) * 100))
  return (
    <div className="rounded-xl border border-hairline bg-ink-900/40 p-3.5">
      <div className="flex items-center justify-between">
        <p className="text-[12px] font-medium text-ink-300">{label}</p>
        <p className="text-[12px] font-semibold text-ink-100">
          {usage.unlimited ? "Unlimited" : `${usage.count} / ${usage.limit}`}
        </p>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            usage.unlimited
              ? "w-full bg-gradient-to-r from-brand-500 to-ember-500"
              : pct >= 100
                ? "bg-red-500"
                : "bg-brand-500",
          )}
          style={usage.unlimited ? undefined : { width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
