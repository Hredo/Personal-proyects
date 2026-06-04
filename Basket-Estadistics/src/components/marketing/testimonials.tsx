import { FadeIn } from "@/components/animations/fade-in"

type Testimonial = {
  quote: string
  name: string
  role: string
  league: "NBA" | "EuroLeague" | "ACB"
  initials: string
  accent: "brand" | "euro" | "acb"
  rating: number
}

const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "I used to keep four spreadsheets open during the playoffs. Now I open one tab. The cross-league comparison is what every scout I know has been begging for.",
    name: "Marta R.",
    role: "Pro Scout",
    league: "EuroLeague",
    initials: "MR",
    accent: "euro",
    rating: 5,
  },
  {
    quote:
      "The pace and possession normalization is honest math, not a marketing layer. I trust the numbers and I trust the sourcing. Rare combo.",
    name: "Diego V.",
    role: "Analytics Lead",
    league: "ACB",
    initials: "DV",
    accent: "acb",
    rating: 5,
  },
  {
    quote:
      "Put Doncic and Campazzo side by side and the gap shows up in two seconds. I share screenshots with my staff every Monday.",
    name: "Alex P.",
    role: "Assistant GM",
    league: "NBA",
    initials: "AP",
    accent: "brand",
    rating: 5,
  },
  {
    quote:
      "The free beta already feels like a paid product. The only thing I wish for is dark mode by default — and you already shipped it.",
    name: "Santi O.",
    role: "Video Coordinator",
    league: "EuroLeague",
    initials: "SO",
    accent: "euro",
    rating: 4,
  },
  {
    quote:
      "Finally a tool that takes the ACB as seriously as the NBA. The per-game scales match the broadcasts, and the data is current.",
    name: "Lucía F.",
    role: "Journalist",
    league: "ACB",
    initials: "LF",
    accent: "acb",
    rating: 5,
  },
  {
    quote:
      "I open the console before I open Synergy. That sentence would have been unthinkable a year ago.",
    name: "Jordan K.",
    role: "Player Development",
    league: "NBA",
    initials: "JK",
    accent: "brand",
    rating: 5,
  },
]

const ACCENT_RING: Record<Testimonial["accent"], string> = {
  brand: "ring-league-nba-500/40",
  euro: "ring-league-euro-500/40",
  acb: "ring-league-acb-500/40",
}
const ACCENT_BG: Record<Testimonial["accent"], string> = {
  brand: "bg-league-nba-500/15 text-league-nba-300 border-league-nba-500/30",
  euro: "bg-league-euro-500/15 text-league-euro-300 border-league-euro-500/30",
  acb: "bg-league-acb-500/15 text-league-acb-300 border-league-acb-500/30",
}
const ACCENT_PILL: Record<Testimonial["accent"], string> = {
  brand: "bg-league-nba-500/20 text-league-nba-300",
  euro: "bg-league-euro-500/20 text-league-euro-300",
  acb: "bg-league-acb-500/20 text-league-acb-300",
}

function Stars({ rating }: { rating: number }) {
  return (
    <div
      className="flex items-center gap-0.5"
      aria-label={`${rating} out of 5 stars`}
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          className={`h-3.5 w-3.5 ${
            i < rating ? "fill-brand-400 text-brand-400" : "fill-white/10 text-white/10"
          }`}
          viewBox="0 0 20 20"
          aria-hidden
        >
          <path d="M10 1.5l2.6 5.4 5.9.9-4.3 4.1 1 5.9L10 15l-5.2 2.8 1-5.9L1.5 7.8l5.9-.9L10 1.5z" />
        </svg>
      ))}
    </div>
  )
}

export function Testimonials() {
  return (
    <section
      aria-labelledby="testimonials-heading"
      className="relative border-t border-white/5 py-16 sm:py-24"
    >
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-grid-fade opacity-30"
      />
      <div className="mx-auto max-w-2xl text-center">
        <FadeIn>
          <span className="inline-flex items-center gap-2 rounded-full border border-accent-cyan/30 bg-accent-cyan/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-accent-cyan sm:text-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-cyan" />
            Field reports
          </span>
          <h2
            id="testimonials-heading"
            className="mt-4 font-display text-3xl font-bold leading-[1.05] tracking-tight sm:text-4xl md:text-5xl"
          >
            What scouts, GMs and <span className="text-gradient-brand">coaches</span>{" "}
            are saying.
          </h2>
          <p className="mt-4 text-sm text-ink-200 sm:text-base">
            Independent beta users, three leagues, one console. We collect
            feedback every release cycle and ship on it.
          </p>
        </FadeIn>
      </div>

      <ul className="mx-auto mt-10 grid max-w-6xl grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
        {TESTIMONIALS.map((t, i) => (
          <li key={t.name} className="h-full">
            <FadeIn delay={0.05 * (i % 3)} y={18}>
              <article
                className={`group flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-5 ring-1 ring-inset ring-white/5 transition hover:border-white/20 hover:bg-white/[0.05] sm:p-6 ${ACCENT_RING[t.accent]}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <Stars rating={t.rating} />
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest ${ACCENT_BG[t.accent]}`}
                  >
                    {t.league}
                  </span>
                </div>
                <svg
                  aria-hidden
                  className="mt-4 h-6 w-6 text-brand-400/80"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M9.13 14.5H4.75a.75.75 0 0 1-.75-.75v-3.5a6.25 6.25 0 0 1 6.25-6.25.75.75 0 0 1 0 1.5 4.75 4.75 0 0 0-4.75 4.75v2.75h3.63a.75.75 0 0 1 0 1.5Zm10.12 0h-4.38a.75.75 0 0 1-.75-.75v-3.5a6.25 6.25 0 0 1 6.25-6.25.75.75 0 0 1 0 1.5 4.75 4.75 0 0 0-4.75 4.75v2.75h3.63a.75.75 0 0 1 0 1.5Z" />
                </svg>
                <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-ink-100 sm:text-[15px]">
                  {t.quote}
                </blockquote>
                <footer className="mt-5 flex items-center gap-3 border-t border-white/5 pt-4">
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-full border font-display text-sm font-bold ${ACCENT_BG[t.accent]}`}
                  >
                    {t.initials}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink-50">
                      {t.name}
                    </p>
                    <p className="truncate text-[11px] uppercase tracking-wider text-ink-400">
                      {t.role}
                    </p>
                  </div>
                  <span
                    className={`ml-auto shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest ${ACCENT_PILL[t.accent]}`}
                  >
                    beta
                  </span>
                </footer>
              </article>
            </FadeIn>
          </li>
        ))}
      </ul>
      <p className="mx-auto mt-8 max-w-3xl text-center text-[11px] uppercase tracking-widest text-ink-500">
        Testimonials from independent beta testers · roles anonymized
      </p>
    </section>
  )
}
