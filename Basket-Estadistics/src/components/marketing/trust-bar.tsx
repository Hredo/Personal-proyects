import { FadeIn } from "@/components/animations/fade-in"

const SOURCES = [
  {
    label: "NBA",
    color: "text-league-nba-300",
    border: "border-league-nba-500/30",
    bg: "bg-league-nba-500/5",
  },
  {
    label: "EuroLeague",
    color: "text-league-euro-300",
    border: "border-league-euro-500/30",
    bg: "bg-league-euro-500/5",
  },
  {
    label: "Liga ACB",
    color: "text-league-acb-300",
    border: "border-league-acb-500/30",
    bg: "bg-league-acb-500/5",
  },
]

export function TrustBar() {
  return (
    <section
      aria-labelledby="trustbar-heading"
      className="relative border-t border-white/5 py-12 sm:py-16"
    >
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-grid-fade opacity-25"
      />
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <FadeIn>
          <div className="text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-ink-300 sm:text-[11px]">
              Data sources
            </p>
            <h2
              id="trustbar-heading"
              className="mt-2 font-display text-2xl font-bold leading-tight text-ink-50 sm:text-3xl"
            >
              Public feeds.{" "}
              <span className="text-gradient-brand">Honest math.</span>
            </h2>
            <p className="mt-2 text-sm text-ink-300 sm:text-[15px]">
              Every stat, every standings line, every box score comes from the
              leagues&apos; own public feeds. We don&apos;t fabricate anything
              and we don&apos;t sell your data.
            </p>
          </div>
        </FadeIn>

        <FadeIn delay={0.08}>
          <ul className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
            {SOURCES.map((s) => (
              <li
                key={s.label}
                className={`flex items-center justify-between gap-3 rounded-2xl border ${s.border} ${s.bg} px-4 py-4 sm:px-5`}
              >
                <span
                  className={`font-display text-base font-bold sm:text-lg ${s.color}`}
                >
                  {s.label}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-widest text-ink-400">
                  Public feed
                </span>
              </li>
            ))}
          </ul>
        </FadeIn>

        <FadeIn delay={0.16}>
          <p className="mx-auto mt-6 max-w-2xl text-center text-[11px] uppercase tracking-widest text-ink-500">
            Data sourced from public feeds · No paid placements · No sponsor
            boosts in rankings
          </p>
        </FadeIn>
      </div>
    </section>
  )
}
