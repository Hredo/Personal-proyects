import Link from "next/link"
import { FadeIn } from "@/components/animations/fade-in"
import { WaitlistForm } from "@/components/marketing/waitlist-form"

const TIERS = [
  {
    name: "Public",
    price: "Free",
    cadence: "during the beta",
    description:
      "Full directory, every comparison, every league hub. Open to everyone.",
    cta: { href: "/players", label: "Browse the database" },
    features: [
      "Players, teams and coaches",
      "Cross-league compare",
      "League hubs with leaders",
      "AI advisor in read-only mode",
    ],
    accent: "border-white/15",
    ctaStyle:
      "border border-white/10 bg-white/5 text-ink-50 hover:border-brand-400/60",
  },
  {
    name: "Pro",
    price: "Early access",
    cadence: "closed beta",
    description:
      "Shortlists, exports and persistent AI advisor sessions. We&apos;re onboarding one cohort at a time.",
    cta: { href: "#waitlist-form", label: "Request access" },
    features: [
      "Everything in Public",
      "Shortlists with notes and share links",
      "PDF / Excel / Word exports",
      "Priority sync, no rate limits",
    ],
    accent: "border-brand-400/50",
    badge: "Most useful",
    ctaStyle: "bg-brand-500 text-ink-950 hover:bg-brand-400",
  },
]

export function PricingCta() {
  return (
    <section
      id="waitlist"
      aria-labelledby="pricing-heading"
      className="relative border-t border-white/5 py-16 sm:py-24"
    >
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-grid-fade opacity-25"
      />
      <div className="mx-auto max-w-2xl text-center">
        <FadeIn>
          <span className="inline-flex items-center gap-2 rounded-full border border-accent-magenta/30 bg-accent-magenta/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-accent-magenta sm:text-xs">
            Access
          </span>
          <h2
            id="pricing-heading"
            className="mt-4 font-display text-3xl font-bold leading-[1.05] tracking-tight sm:text-4xl md:text-5xl"
          >
            Free forever.{" "}
            <span className="text-gradient-brand">Pro when you need it.</span>
          </h2>
          <p className="mt-4 text-sm text-ink-200 sm:text-base">
            We&apos;ll never paywall the data. The Pro tier is for the people
            who want to work faster, save shortlists and export reports.
          </p>
        </FadeIn>
      </div>

      <div className="mx-auto mt-10 grid max-w-4xl gap-4 sm:mt-12 sm:gap-6 md:grid-cols-2">
        {TIERS.map((t, i) => (
          <FadeIn key={t.name} delay={0.05 * (i + 1)}>
            <article
              className={`relative flex h-full flex-col rounded-2xl border bg-white/[0.03] p-5 ring-1 ring-inset ring-white/5 sm:p-7 ${t.accent}`}
            >
              {t.badge ? (
                <span className="absolute -top-2.5 right-5 rounded-full bg-brand-500 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-ink-950 shadow-[var(--shadow-brand-glow)]">
                  {t.badge}
                </span>
              ) : null}
              <header>
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-ink-300 sm:text-[11px]">
                  {t.name}
                </p>
                <p className="mt-2 font-display text-3xl font-bold leading-none text-ink-50 sm:text-4xl">
                  {t.price}
                </p>
                <p className="mt-1 text-xs text-ink-400 sm:text-sm">
                  {t.cadence}
                </p>
              </header>
              <p className="mt-4 text-sm text-ink-200">{t.description}</p>
              <ul className="mt-5 space-y-2.5">
                {t.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2 text-sm text-ink-100"
                  >
                    <svg
                      aria-hidden
                      className="mt-0.5 h-4 w-4 shrink-0 text-brand-300"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-auto pt-6">
                <Link
                  href={t.cta.href}
                  className={`inline-flex w-full items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold transition sm:text-base ${t.ctaStyle}`}
                >
                  {t.cta.label}
                  <svg
                    className="h-3.5 w-3.5"
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
              </div>
            </article>
          </FadeIn>
        ))}
      </div>

      <div className="mx-auto mt-10 max-w-md text-center sm:mt-12">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-ink-400 sm:text-[11px]">
          Join the Pro waitlist
        </p>
        <WaitlistForm source="pricing" />
        <p className="mt-3 text-[11px] text-ink-500">
          One email when we open the next cohort. We don&apos;t share it.
        </p>
      </div>

      <p className="mx-auto mt-8 max-w-2xl text-center text-xs text-ink-400 sm:text-sm">
        Pro pricing will be published when the closed beta opens. We&apos;re not
        in a hurry, and the data stays free.
      </p>
    </section>
  )
}
