"use client"

import { CountUp } from "@/components/marketing/count-up"

type Stat = { value: number; label: string; accent: "brand" | "cyan" | "magenta" | "lime" }

type Props = {
  counts: {
    leagues: number
    players: number
    teams: number
    coaches: number
  }
}

const ACCENT_TEXT: Record<Stat["accent"], string> = {
  brand: "text-brand-400",
  cyan: "text-accent-cyan",
  magenta: "text-accent-magenta",
  lime: "text-accent-lime",
}

export function GlobalStatsBand({ counts }: Props) {
  const stats: Stat[] = [
    { value: counts.leagues, label: "leagues live", accent: "brand" },
    { value: counts.players, label: "players indexed", accent: "cyan" },
    { value: counts.teams, label: "teams tracked", accent: "magenta" },
    { value: counts.coaches, label: "coaches on file", accent: "lime" },
  ]
  return (
    <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
      {stats.map((s) => (
        <div
          key={s.label}
          className="relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 sm:px-5 sm:py-4"
        >
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
          <p
            className={`font-display text-2xl font-bold tabular-nums sm:text-3xl ${ACCENT_TEXT[s.accent]}`}
          >
            <CountUp to={s.value} duration={1100} />
          </p>
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-300 sm:text-[11px]">
            {s.label}
          </p>
        </div>
      ))}
    </div>
  )
}
