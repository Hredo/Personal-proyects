import { FadeIn } from "@/components/animations/fade-in"
import { leagueAccent } from "@/components/ui/league-badge"

const LEAGUES = [
  { name: "NBA", slug: "nba" },
  { name: "EuroLeague", slug: "euroleague" },
  { name: "Liga ACB", slug: "acb" },
  { name: "LEB Oro", slug: "leb-oro" },
  { name: "LEB Plata", slug: "leb-plata" },
  { name: "EBA", slug: "eba" },
]

const PILOT_USERS = [
  "Pro scouting dept.",
  "NCAA programs",
  "Player agencies",
  "Journalism desks",
  "High-school academies",
  "Fantasy leagues",
]

export function TrustedBy() {
  return (
    <section
      aria-label="Coverage and early access"
      className="relative hairline-t hairline-b bg-surface-0/40 py-12 sm:py-16"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <FadeIn>
          <div className="grid items-center gap-8 md:grid-cols-[1fr_2fr]">
            <div>
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-400">
                Coverage today
              </p>
              <h2 className="mt-3 font-display text-2xl font-bold leading-tight tracking-[-0.02em] text-ink-50 sm:text-3xl">
                Six leagues live.{" "}
                <span className="text-gradient-brand">More on the way.</span>
              </h2>
              <p className="mt-3 text-pretty text-sm text-ink-300 sm:text-[15px]">
                The NBA, EuroLeague, ACB and Spain&apos;s full FEB ladder are in
                today. The WNBA, FIBA windows and the Australian NBL are next.
              </p>
            </div>
            <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {LEAGUES.map((l) => {
                const a = leagueAccent(l.slug)
                return (
                  <li
                    key={l.name}
                    className="flex items-center justify-between gap-2 rounded-xl border border-hairline bg-white/[0.02] px-4 py-3 transition-colors duration-200 hover:border-hairline-strong"
                  >
                    <span className="flex items-center gap-2 font-display text-sm font-bold text-ink-100 sm:text-base">
                      <span
                        aria-hidden
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: a.color }}
                      />
                      {l.name}
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-500">
                      live
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
        </FadeIn>
        <FadeIn delay={0.1}>
          <p className="mt-8 font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-ink-500">
            Early access users
          </p>
          <ul className="mt-3 flex flex-wrap gap-2 sm:gap-3">
            {PILOT_USERS.map((u) => (
              <li
                key={u}
                className="rounded-full border border-hairline bg-white/[0.03] px-3.5 py-1.5 text-xs text-ink-200"
              >
                {u}
              </li>
            ))}
          </ul>
        </FadeIn>
      </div>
    </section>
  )
}
