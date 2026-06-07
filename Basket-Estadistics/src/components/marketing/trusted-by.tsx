import { FadeIn } from "@/components/animations/fade-in"

const LEAGUES = [
  {
    name: "NBA",
    color: "text-league-nba-300",
    border: "border-league-nba-500/30",
  },
  {
    name: "EuroLeague",
    color: "text-league-euro-300",
    border: "border-league-euro-500/30",
  },
  {
    name: "Liga ACB",
    color: "text-league-acb-300",
    border: "border-league-acb-500/30",
  },
  { name: "WNBA*", color: "text-ink-200", border: "border-white/10" },
  { name: "FIBA*", color: "text-ink-200", border: "border-white/10" },
  { name: "NBL*", color: "text-ink-200", border: "border-white/10" },
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
      className="relative border-y border-white/5 bg-ink-950/40 py-10 sm:py-14"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <FadeIn>
          <div className="grid items-center gap-8 md:grid-cols-[1fr_2fr]">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-ink-300 sm:text-[11px]">
                Coverage today
              </p>
              <h2 className="mt-2 font-display text-2xl font-bold leading-tight text-ink-50 sm:text-3xl">
                Three leagues live.{" "}
                <span className="text-gradient-brand">More on the way.</span>
              </h2>
              <p className="mt-2 text-sm text-ink-300 sm:text-[15px]">
                We&apos;re onboarding scouts, programs and agencies to the
                closed beta for the WNBA, FIBA windows and the Australian NBL.
              </p>
            </div>
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
              {LEAGUES.map((l) => (
                <li
                  key={l.name}
                  className={`flex items-center justify-between gap-2 rounded-xl border bg-white/[0.02] px-3 py-3 sm:px-4 ${l.border}`}
                >
                  <span
                    className={`font-display text-sm font-bold sm:text-base ${l.color}`}
                  >
                    {l.name}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-ink-400">
                    live
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </FadeIn>
        <FadeIn delay={0.1}>
          <p className="mt-6 text-[10px] font-semibold uppercase tracking-[0.22em] text-ink-400">
            Early access users
          </p>
          <ul className="mt-3 flex flex-wrap gap-2 sm:gap-3">
            {PILOT_USERS.map((u) => (
              <li
                key={u}
                className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-ink-200"
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
