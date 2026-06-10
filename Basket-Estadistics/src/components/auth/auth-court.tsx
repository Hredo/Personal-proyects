"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"

// The 1v1 scene is decorative and desktop-only, so its chunk is split out and
// fetched lazily — it only ever downloads on /login and /register, and only on
// lg+ viewports (the panel is hidden below lg).
const AuthDuel = dynamic(() => import("@/components/auth/auth-duel"), {
  ssr: false,
  loading: () => null,
})

export type AuthCourtStats = {
  leagues: number
  players: number
  teams: number
  coaches: number
}

type Props = {
  className?: string
  stats: AuthCourtStats
}

const LEAGUES = ["NBA", "EuroLeague", "ACB", "LEB Oro", "LEB Plata", "EBA"]

export function AuthCourt({ className, stats }: Props) {
  const [sceneOn, setSceneOn] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)")
    const update = () => setSceneOn(mq.matches)
    update()
    mq.addEventListener("change", update)
    return () => mq.removeEventListener("change", update)
  }, [])

  const cards = [
    { label: "Leagues live", value: String(stats.leagues) },
    { label: "Players indexed", value: stats.players.toLocaleString("en-US") },
    { label: "Teams tracked", value: stats.teams.toLocaleString("en-US") },
    { label: "Coaches on file", value: stats.coaches.toLocaleString("en-US") },
  ]

  return (
    <div className={className}>
      <div className="relative h-full w-full overflow-hidden">
        {/* Soft ambient glow that fades to transparent — the global body
            background stays visible underneath, so there is no seam. */}
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(62%_52%_at_56%_42%,oklch(0.32_0.08_50_/_0.3),transparent_72%)]"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(40%_30%_at_56%_78%,oklch(0.25_0.06_40_/_0.25),transparent_70%)]"
        />

        {sceneOn ? (
          <AuthDuel className="absolute inset-0 h-full w-full" />
        ) : null}

        <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-8 sm:p-12">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-brand-300/80">
              globalhoopstats
            </p>
            <h2 className="mt-3 max-w-md font-display text-2xl font-bold text-ink-50 sm:text-3xl lg:text-4xl">
              Hoops, decoded.
            </h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-ink-300 sm:text-base">
              Sign in to keep your advisor conversations, run unlimited AI
              comparisons and unlock the full scouting toolkit.
            </p>
          </div>

          <div className="space-y-4">
            <div className="grid max-w-md grid-cols-2 gap-3">
              {cards.map((s) => (
                <div
                  key={s.label}
                  className="rounded-lg border border-white/5 bg-ink-950/40 px-3 py-2 backdrop-blur-sm"
                >
                  <p className="font-mono text-[9px] uppercase tracking-widest text-ink-500">
                    {s.label}
                  </p>
                  <p className="mt-0.5 text-sm font-semibold tabular-nums text-ink-100 sm:text-base">
                    {s.value}
                  </p>
                </div>
              ))}
            </div>
            <div className="flex max-w-md flex-wrap items-center gap-x-2 gap-y-1">
              {LEAGUES.map((l, i) => (
                <span
                  key={l}
                  className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-400"
                >
                  {i > 0 ? (
                    <span aria-hidden className="text-ink-600">
                      ·
                    </span>
                  ) : null}
                  {l}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuthCourt
