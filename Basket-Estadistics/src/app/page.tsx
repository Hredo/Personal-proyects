import { Basketball } from "@/components/svg/basketball"
import { Court } from "@/components/svg/court"
import { FadeIn } from "@/components/animations/fade-in"
import { Float } from "@/components/animations/float"
import { PlayerSearch } from "@/components/players/player-search"

const PILLARS = [
  {
    title: "Global stats, normalized",
    body: "One model for NBA, ACB and EuroLeague. Per-game, advanced metrics and season splits in a single view.",
  },
  {
    title: "Side-by-side compare",
    body: "Stack up to four players with a radar overlay and a color-coded diff table. Spot strengths and gaps in seconds.",
  },
  {
    title: "Highlights on demand",
    body: "YouTube-powered highlight reels fetched on demand for every player in the database.",
  },
] as const

const ROADMAP = [
  { tag: "Now", label: "NBA · ACB · EuroLeague ingest" },
  { tag: "Q3", label: "WNCAA, Liga Endesa Femenina, Lega Basket Serie A" },
  { tag: "Q4", label: "Asia (B.League, CBA, KBL) and Latin America (NBB, LMB)" },
  { tag: "Next", label: "Shortlists, scouting reports, shareable comparisons" },
] as const

export default function Home() {
  return (
    <div className="relative">
      <section className="relative isolate overflow-hidden pb-24 pt-16 md:pt-24">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-court-grid opacity-40"
        />
        <div
          aria-hidden
          className="absolute -top-32 left-1/2 -z-10 h-[520px] w-[920px] -translate-x-1/2 rounded-full bg-brand-500/20 blur-3xl"
        />
        <div className="grid items-center gap-12 md:grid-cols-[1.1fr_0.9fr]">
          <div>
            <FadeIn>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-ink-200">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-400" />
                Scouting intelligence
              </span>
            </FadeIn>
            <FadeIn delay={0.1} y={32}>
              <h1 className="mt-6 font-display text-5xl font-bold leading-[1.05] tracking-tight text-balance text-ink-50 md:text-7xl">
                Every stat from{" "}
                <span className="text-gradient-brand">every league</span>,
                one scouting console.
              </h1>
            </FadeIn>
            <FadeIn delay={0.2} y={20}>
              <p className="mt-6 max-w-xl text-lg text-ink-200">
                Basket Estadistics aggregates public data from professional
                leagues worldwide, normalizes it, and exposes player
                profiles, comparatives and highlight reels built for front
                offices.
              </p>
            </FadeIn>
            <FadeIn delay={0.3} y={16}>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <a
                  href="#waitlist"
                  className="rounded-md bg-brand-500 px-5 py-3 text-sm font-semibold text-ink-950 shadow-[var(--shadow-brand-glow)] transition hover:bg-brand-400"
                >
                  Get team access
                </a>
                <a
                  href="#product"
                  className="rounded-md border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-ink-50 transition hover:border-brand-400/60 hover:text-brand-200"
                >
                  See the product
                </a>
              </div>
            </FadeIn>
            <FadeIn delay={0.4}>
              <div className="mt-8 max-w-xl">
                <PlayerSearch
                  inputClassName="py-5 text-lg"
                  emptyHeadline="Top scorers this season"
                />
                <p className="mt-2 flex items-center gap-2 text-xs text-ink-400">
                  <span>
                    Live data from the NBA, EuroLeague and Liga ACB — points,
                    assists, rebounds and shooting splits, one keystroke away.
                  </span>
                </p>
              </div>
            </FadeIn>
            <FadeIn delay={0.45}>
              <dl className="mt-10 grid max-w-md grid-cols-3 gap-6">
                {[
                  { k: "3", v: "leagues live" },
                  { k: "20+", v: "advanced metrics" },
                  { k: "<2s", v: "compare overlay" },
                ].map((stat) => (
                  <div key={stat.v}>
                    <dt className="font-display text-3xl font-bold text-ink-50">
                      {stat.k}
                    </dt>
                    <dd className="mt-1 text-xs uppercase tracking-wider text-ink-300">
                      {stat.v}
                    </dd>
                  </div>
                ))}
              </dl>
            </FadeIn>
          </div>
          <div className="relative">
            <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-br from-brand-500/20 via-transparent to-accent-cyan/10 blur-2xl" />
            <FadeIn delay={0.15}>
              <div className="relative aspect-[5/3] w-full">
                <Court className="absolute inset-0 h-full w-full" />
                <Float className="absolute right-[6%] top-[6%] h-24 w-24 md:h-32 md:w-32">
                  <Basketball className="h-full w-full drop-shadow-[0_20px_30px_rgba(0,0,0,0.45)]" />
                </Float>
                <Float
                  className="absolute left-[10%] bottom-[10%] h-12 w-12 md:h-16 md:w-16"
                  duration={5}
                  y={8}
                >
                  <Basketball className="h-full w-full opacity-80" />
                </Float>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      <section id="product" className="border-t border-white/5 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <FadeIn>
            <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
              Built for front offices
            </h2>
            <p className="mt-4 text-ink-200">
              Three pillars, designed to compress scouting time from days to
              minutes.
            </p>
          </FadeIn>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {PILLARS.map((pillar, i) => (
            <FadeIn key={pillar.title} delay={0.05 * i}>
              <article className="group relative h-full overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-brand-400/50 hover:bg-white/[0.05]">
                <span className="absolute right-4 top-4 font-mono text-xs text-ink-400">
                  0{i + 1}
                </span>
                <h3 className="font-display text-xl font-semibold text-ink-50">
                  {pillar.title}
                </h3>
                <p className="mt-3 text-sm text-ink-200">{pillar.body}</p>
                <div
                  aria-hidden
                  className="pointer-events-none absolute -bottom-12 -right-12 h-32 w-32 rounded-full bg-brand-500/0 blur-2xl transition group-hover:bg-brand-500/30"
                />
              </article>
            </FadeIn>
          ))}
        </div>
      </section>

      <section className="border-t border-white/5 py-24">
        <div className="grid gap-12 md:grid-cols-[1fr_1.2fr]">
          <FadeIn>
            <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
              Roadmap
            </h2>
            <p className="mt-4 text-ink-200">
              A controlled rollout. The MVP focuses on the three most-watched
              leagues; additional federations unlock progressively.
            </p>
          </FadeIn>
          <FadeIn delay={0.1}>
            <ol className="relative space-y-4 border-l border-white/10 pl-6">
              {ROADMAP.map((step) => (
                <li key={step.label} className="relative">
                  <span className="absolute -left-[31px] top-1 h-3 w-3 rounded-full border border-brand-400 bg-ink-950" />
                  <p className="font-mono text-xs uppercase tracking-wider text-brand-300">
                    {step.tag}
                  </p>
                  <p className="mt-1 text-ink-100">{step.label}</p>
                </li>
              ))}
            </ol>
          </FadeIn>
        </div>
      </section>

      <section
        id="waitlist"
        className="relative isolate my-24 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-court-800/80 to-ink-900/90 p-10 md:p-16"
      >
        <div
          aria-hidden
          className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-brand-500/30 blur-3xl"
        />
        <div className="relative grid items-center gap-8 md:grid-cols-[1.2fr_1fr]">
          <div>
            <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
              Request team access
            </h2>
            <p className="mt-4 max-w-md text-ink-200">
              Free during the MVP. Limited seats while we onboard the first
              wave of clubs.
            </p>
          </div>
          <form
            className="flex flex-col gap-3 sm:flex-row"
            action="mailto:Hrvaldes22@gmail.com"
            method="post"
            encType="text/plain"
          >
            <label htmlFor="email" className="sr-only">
              Work email
            </label>
            <input
              id="email"
              type="email"
              name="email"
              required
              placeholder="you@club.com"
              className="w-full rounded-md border border-white/10 bg-ink-950/60 px-4 py-3 text-ink-50 placeholder:text-ink-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
            />
            <button
              type="submit"
              className="rounded-md bg-brand-500 px-5 py-3 text-sm font-semibold text-ink-950 shadow-[var(--shadow-brand-glow)] transition hover:bg-brand-400"
            >
              Request invite
            </button>
          </form>
        </div>
      </section>
    </div>
  )
}
