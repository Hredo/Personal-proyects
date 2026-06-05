import type { Metadata } from "next"
import Link from "next/link"
import { FadeIn } from "@/components/animations/fade-in"
import { Float } from "@/components/animations/float"
import { CourtPerspective } from "@/components/svg/court-perspective"
import { CountUp } from "@/components/marketing/count-up"
import { Marquee } from "@/components/marketing/marquee"
import { JsonLd } from "@/components/marketing/json-ld"
import { TrustedBy } from "@/components/marketing/trusted-by"
import { FeatureShowcase } from "@/components/marketing/feature-showcase"
import { TrustBar } from "@/components/marketing/trust-bar"
import { Faq } from "@/components/marketing/faq"
import { FAQ_DATA } from "@/components/marketing/faq-data"
import { PricingCta } from "@/components/marketing/pricing-cta"
import { SITE } from "@/lib/site"
import { getGlobalLeagueCounts } from "@/lib/data/leagues"

const TICKER_LEFT = [
  { name: "Luka Dončić", team: "DAL · NBA", stat: "32.4 PPG" },
  { name: "Facundo Campazzo", team: "RMB · EuroLeague", stat: "6.8 APG" },
  { name: "Santi Aldama", team: "MEM · NBA", stat: "51% FG" },
  { name: "Nikola Mirotić", team: "FCB · EuroLeague", stat: "18.1 PPG" },
  { name: "Willy Hernangómez", team: "RMB · EuroLeague", stat: "8.4 RPG" },
  { name: "Carlos Alocén", team: "ZAR · ACB", stat: "5.2 APG" },
  { name: "Juan Núñez", team: "RMB · EuroLeague", stat: "4.9 APG" },
  { name: "Dario Brizuela", team: "FCB · ACB", stat: "14.2 PPG" },
]

const TICKER_RIGHT = [
  { name: "Jokić", stat: "27.1 / 12.4 / 9.0" },
  { name: "Doncic", stat: "32.4 / 8.6 / 9.1" },
  { name: "Antetokounmpo", stat: "30.4 / 11.5 / 6.5" },
  { name: "Campazzo", stat: "11.2 / 3.0 / 6.8" },
  { name: "Mirotic", stat: "18.1 / 5.3 / 1.4" },
  { name: "Aldama", stat: "10.7 / 5.0 / 1.4" },
  { name: "Brizuela", stat: "14.2 / 2.4 / 2.1" },
  { name: "Núñez", stat: "8.1 / 2.6 / 4.9" },
]

const STATS = [
  { v: 3, suffix: "", label: "Leagues live" },
  { v: 0, suffix: "+", label: "Players indexed", dynamic: "players" as const },
  { v: 24, suffix: "", label: "Advanced metrics" },
  { v: 2, suffix: "s", label: "To compare any two", decimals: 0 },
]

const PILLARS = [
  {
    n: "01",
    title: "Ingest",
    body: "Public box scores from the NBA, ACB and EuroLeague pipelines. Refreshed after every tip-off.",
  },
  {
    n: "02",
    title: "Normalize",
    body: "Same per-game scale, same advanced metrics, same court. Spanish minutes, American possessions, one model.",
  },
  {
    n: "03",
    title: "Compare",
    body: "Side-by-side overlays, radar diffs, and color-coded bars. Spot the gap in seconds, not film sessions.",
  },
]

export const revalidate = 3600

export const metadata: Metadata = {
  title: `${SITE.tagline} — NBA, EuroLeague & ACB scouting intelligence`,
  description: SITE.description,
  alternates: { canonical: "/" },
  openGraph: {
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
    url: SITE.url,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
  },
}

export default async function Home() {
  const counts = await getGlobalLeagueCounts()
  const stats = STATS.map((s) =>
    "dynamic" in s && s.dynamic === "players" ? { ...s, v: counts.players } : s,
  )
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_DATA.map((q) => ({
      "@type": "Question",
      name: q.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: q.answer,
      },
    })),
  }

  const softwareJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: SITE.name,
    url: SITE.url,
    applicationCategory: "SportsApplication",
    applicationSubCategory: "Basketball Analytics",
    operatingSystem: "Web",
    description: SITE.description,
    offers: [
      {
        "@type": "Offer",
        name: "Public beta",
        price: "0",
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
      },
    ],
    featureList: [
      "Cross-league player comparison",
      "Pace and possession normalization",
      "Advanced metrics (PER, ORtg, DRtg, NetRtg, TS%)",
      "League hubs with leaders",
      "AI advisor for scouting queries",
      "Exports to PDF, Excel and Word",
    ],
  }

  return (
    <div className="relative">
      <JsonLd data={[faqJsonLd, softwareJsonLd]} />

      <section className="relative isolate overflow-hidden pb-12 pt-8 sm:pb-20 sm:pt-14 md:pt-20">
        <div
          aria-hidden
          className="absolute inset-0 -z-20 bg-grid-fade opacity-70"
        />
        <div
          aria-hidden
          className="absolute -top-40 left-1/2 -z-10 h-[420px] w-[760px] -translate-x-1/2 rounded-full bg-brand-500/20 blur-3xl sm:h-[560px] sm:w-[1100px]"
        />
        <div
          aria-hidden
          className="absolute right-[5%] top-[30%] -z-10 hidden h-72 w-72 rounded-full bg-accent-magenta/15 blur-3xl md:block"
        />

        <div className="grid items-center gap-10 md:grid-cols-[1.05fr_0.95fr] md:gap-12">
          <div>
            <FadeIn>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-ink-200 sm:text-xs">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand-400" />
                </span>
                v0.3 — NBA · ACB · EuroLeague
              </span>
            </FadeIn>

            <FadeIn delay={0.08} y={28}>
              <h1 className="mt-5 font-display text-[2.6rem] font-bold leading-[0.95] tracking-[-0.02em] text-ink-50 sm:mt-6 sm:text-6xl md:text-7xl xl:text-[5.5rem]">
                Hoops, <span className="text-gradient-shimmer">decoded.</span>
              </h1>
            </FadeIn>

            <FadeIn delay={0.18} y={20}>
              <p className="mt-5 max-w-xl text-base text-ink-200 sm:mt-6 sm:text-lg">
                The basketball operating system for serious scouts. Box scores,
                advanced splits and side-by-side comparisons from the NBA, ACB
                and EuroLeague — all in one console, all in the same language.
              </p>
            </FadeIn>

            <FadeIn delay={0.28} y={16}>
              <div className="mt-7 flex flex-wrap items-center gap-3 sm:mt-8 sm:gap-4">
                <Link
                  href="/compare"
                  className="group inline-flex items-center gap-2 rounded-md bg-brand-500 px-5 py-3 text-sm font-semibold text-ink-950 shadow-[var(--shadow-brand-glow)] transition hover:bg-brand-400 sm:px-6 sm:text-base"
                >
                  Open the console
                  <svg
                    className="h-4 w-4 transition group-hover:translate-x-1"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <path d="M5 12h14M13 5l7 7-7 7" />
                  </svg>
                </Link>
                <Link
                  href="/players"
                  className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-ink-50 transition hover:border-brand-400/60 hover:text-brand-200 sm:text-base"
                >
                  Browse the database
                </Link>
              </div>
            </FadeIn>

            <FadeIn delay={0.4}>
              <dl className="mt-9 grid max-w-lg grid-cols-2 gap-4 sm:mt-12 sm:grid-cols-4 sm:gap-6">
                {stats.map((s) => (
                  <div
                    key={s.label}
                    className="border-l border-white/10 pl-3 sm:pl-4"
                  >
                    <dt className="font-display text-2xl font-bold text-ink-50 sm:text-3xl">
                      <CountUp
                        to={s.v}
                        suffix={s.suffix}
                        decimals={"decimals" in s ? s.decimals : 0}
                      />
                    </dt>
                    <dd className="mt-1 text-[10px] uppercase tracking-wider text-ink-300 sm:text-[11px]">
                      {s.label}
                    </dd>
                  </div>
                ))}
              </dl>
            </FadeIn>
          </div>

          <div className="relative">
            <div
              aria-hidden
              className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-br from-brand-500/25 via-transparent to-accent-cyan/15 blur-2xl"
            />
            <div className="relative aspect-[5/4] w-full">
              <CourtPerspective className="absolute inset-0 h-full w-full" />
              <Float
                className="absolute right-[2%] top-[2%] h-3 w-3 sm:h-4 sm:w-4"
                duration={3}
                y={6}
              >
                <div className="h-full w-full rounded-full bg-accent-cyan/80 shadow-[0_0_20px_4px_rgba(125,200,255,0.45)]" />
              </Float>
              <Float
                className="absolute left-[4%] top-[44%] h-2 w-2 sm:h-3 sm:w-3"
                duration={4}
                y={4}
              >
                <div className="h-full w-full rounded-full bg-accent-magenta/80 shadow-[0_0_20px_4px_rgba(255,100,200,0.45)]" />
              </Float>
            </div>
            <div className="pointer-events-none absolute -bottom-3 left-4 right-4 flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-ink-400 sm:text-[11px]">
              <span>shot chart · live</span>
              <span>trajectory @scroll</span>
            </div>
          </div>
        </div>
      </section>

      <section
        aria-label="Top performers"
        className="border-y border-white/5 bg-ink-950/40 py-3"
      >
        <Marquee duration={55} className="text-sm">
          {TICKER_LEFT.map((t) => (
            <div
              key={t.name}
              className="flex items-center gap-3 whitespace-nowrap font-mono text-[11px] uppercase tracking-wider text-ink-300 sm:text-xs"
            >
              <span className="h-1 w-1 rounded-full bg-brand-400" />
              <span className="text-ink-100">{t.name}</span>
              <span className="text-ink-400">{t.team}</span>
              <span className="text-brand-300">{t.stat}</span>
            </div>
          ))}
        </Marquee>
        <Marquee duration={70} reverse className="mt-2 text-sm">
          {TICKER_RIGHT.map((t) => (
            <div
              key={t.name}
              className="flex items-center gap-3 whitespace-nowrap font-mono text-[11px] uppercase tracking-wider text-ink-300 sm:text-xs"
            >
              <span className="h-1 w-1 rounded-full bg-accent-cyan" />
              <span className="text-ink-100">{t.name}</span>
              <span className="text-ink-400">PTS · REB · AST</span>
              <span className="text-accent-cyan">{t.stat}</span>
            </div>
          ))}
        </Marquee>
      </section>

      <TrustedBy />

      <section className="relative border-t border-white/5 py-16 sm:py-24">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-grid-fade opacity-40"
        />
        <div className="mx-auto max-w-2xl text-center">
          <FadeIn>
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-brand-200 sm:text-xs">
              How it works
            </span>
            <h2 className="mt-4 font-display text-3xl font-bold leading-[1.05] tracking-tight sm:text-4xl md:text-5xl">
              Three leagues,{" "}
              <span className="text-gradient-brand">one engine.</span>
            </h2>
            <p className="mt-4 text-base text-ink-200 sm:text-lg">
              We ingest box scores from the NBA, ACB and EuroLeague, normalize
              pace and possessions, then surface side-by-side comparisons in
              seconds. No spreadsheets, no film sessions at 3am.
            </p>
          </FadeIn>
        </div>
      </section>

      <section
        id="product"
        className="relative border-t border-white/5 py-16 sm:py-24"
      >
        <div className="mx-auto max-w-2xl text-center">
          <FadeIn>
            <span className="inline-flex items-center gap-2 rounded-full border border-accent-magenta/30 bg-accent-magenta/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-accent-magenta sm:text-xs">
              Pipeline
            </span>
            <h2 className="mt-4 font-display text-3xl font-bold leading-[1.05] tracking-tight sm:text-4xl md:text-5xl">
              From tip-off to terminal.
            </h2>
            <p className="mt-3 text-sm text-ink-200 sm:mt-4 sm:text-base">
              Three stages, fully automated. Every match feeds the same model so
              the numbers stay sharp and the rankings stay honest.
            </p>
          </FadeIn>
        </div>
        <div className="mt-10 grid gap-4 sm:mt-12 sm:gap-6 md:grid-cols-3">
          {PILLARS.map((pillar, i) => (
            <FadeIn key={pillar.n} delay={0.05 * i}>
              <article className="group relative h-full overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-brand-400/50 hover:bg-white/[0.05] sm:p-6">
                <div className="flex items-baseline justify-between">
                  <span className="font-mono text-xs uppercase tracking-widest text-brand-300">
                    {pillar.n}
                  </span>
                  <span className="font-display text-2xl font-bold text-ink-700 transition group-hover:text-ink-500">
                    {pillar.title}
                  </span>
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold text-ink-50 sm:text-xl">
                  {pillar.title}
                </h3>
                <p className="mt-2 text-sm text-ink-200 sm:mt-3">
                  {pillar.body}
                </p>
                <div
                  aria-hidden
                  className="pointer-events-none absolute -bottom-12 -right-12 h-32 w-32 rounded-full bg-brand-500/0 blur-2xl transition group-hover:bg-brand-500/30"
                />
              </article>
            </FadeIn>
          ))}
        </div>
      </section>

      <FeatureShowcase />

      <TrustBar />

      <section
        aria-labelledby="faq-heading"
        className="relative border-t border-white/5 py-16 sm:py-24"
      >
        <div className="mx-auto max-w-2xl text-center">
          <FadeIn>
            <span className="inline-flex items-center gap-2 rounded-full border border-accent-lime/30 bg-accent-lime/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-accent-lime sm:text-xs">
              FAQ
            </span>
            <h2
              id="faq-heading"
              className="mt-4 font-display text-3xl font-bold leading-[1.05] tracking-tight sm:text-4xl md:text-5xl"
            >
              The questions scouts ask first.
            </h2>
            <p className="mt-4 text-sm text-ink-200 sm:text-base">
              Data sources, freshness, what&apos;s free, what isn&apos;t. If
              something&apos;s missing, ping us.
            </p>
          </FadeIn>
        </div>
        <div className="mt-10">
          <Faq />
        </div>
      </section>

      <PricingCta />

      <section className="relative my-12 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-court-800/80 via-ink-900/90 to-ink-950 p-6 sm:my-20 sm:p-10 md:p-14">
        <div
          aria-hidden
          className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-brand-500/30 blur-3xl"
        />
        <div
          aria-hidden
          className="absolute -right-16 -bottom-16 h-64 w-64 rounded-full bg-accent-cyan/20 blur-3xl"
        />
        <div
          aria-hidden
          className="absolute inset-0 -z-0 opacity-50"
          style={{
            backgroundImage:
              "linear-gradient(to right, oklch(1 0 0 / 0.05) 1px, transparent 1px), linear-gradient(to bottom, oklch(1 0 0 / 0.05) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage:
              "radial-gradient(ellipse 80% 60% at 50% 50%, black 30%, transparent 80%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 80% 60% at 50% 50%, black 30%, transparent 80%)",
          }}
        />
        <div className="relative grid items-center gap-8 md:grid-cols-[1.1fr_1fr]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-brand-200 sm:text-xs">
              Open to everyone
            </span>
            <h2 className="mt-4 font-display text-3xl font-bold leading-[1.05] tracking-tight sm:text-4xl md:text-5xl">
              The data is live.{" "}
              <span className="text-gradient-brand">No invite needed.</span>
            </h2>
            <p className="mt-4 max-w-md text-base text-ink-200 sm:text-lg">
              Every player, every stat, every highlight — free during the public
              beta. Open the console, drop two names, run the math.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row md:justify-end">
            <Link
              href="/ai-advisor"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-brand-500 px-6 py-3.5 text-base font-semibold text-ink-950 shadow-[var(--shadow-brand-glow)] transition hover:bg-brand-400"
            >
              Try the AI Advisor
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M5 12h14M13 5l7 7-7 7" />
              </svg>
            </Link>
            <Link
              href="/players"
              className="inline-flex items-center justify-center gap-2 rounded-md border border-white/10 bg-white/5 px-6 py-3.5 text-base font-semibold text-ink-50 transition hover:border-brand-400/60 hover:text-brand-200"
            >
              Browse players
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
