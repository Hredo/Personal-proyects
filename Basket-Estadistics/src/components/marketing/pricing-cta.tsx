import { FadeIn } from "@/components/animations/fade-in"
import { WaitlistForm } from "@/components/marketing/waitlist-form"
import { SectionHeading } from "@/components/ui/section-heading"
import { ButtonLink } from "@/components/ui/button"

const TIERS = [
  {
    name: "Public",
    price: "Free",
    cadence: "during the beta",
    description:
      "Full directory, every comparison, every league hub. Open to everyone.",
    cta: { href: "/players", label: "Browse the database", variant: "secondary" as const },
    features: [
      "Players, teams and coaches",
      "Cross-league compare",
      "League hubs with leaders",
      "AI advisor in read-only mode",
    ],
    featured: false,
  },
  {
    name: "Pro",
    price: "Early access",
    cadence: "closed beta",
    description:
      "Shortlists, exports and persistent AI advisor sessions. We're onboarding one cohort at a time.",
    cta: { href: "#waitlist-form", label: "Request access", variant: "primary" as const },
    features: [
      "Everything in Public",
      "Shortlists with notes and share links",
      "PDF / Excel / Word exports",
      "Priority sync, no rate limits",
    ],
    featured: true,
    badge: "Most useful",
  },
]

export function PricingCta() {
  return (
    <section
      id="waitlist"
      aria-labelledby="pricing-heading"
      className="relative hairline-t py-20 sm:py-28"
    >
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-grid-fade opacity-20"
      />
      <FadeIn>
        <SectionHeading
          align="center"
          eyebrow="Access"
          title={
            <span id="pricing-heading">
              Free forever.{" "}
              <span className="text-gradient-brand">Pro when you need it.</span>
            </span>
          }
          description="We'll never paywall the data. The Pro tier is for people who want to work faster — save shortlists and export reports."
        />
      </FadeIn>

      <div className="mx-auto mt-12 grid max-w-4xl gap-4 sm:gap-6 md:grid-cols-2">
        {TIERS.map((t, i) => (
          <FadeIn key={t.name} delay={0.05 * (i + 1)}>
            <article
              className={`gh-card relative flex h-full flex-col p-6 sm:p-8 ${
                t.featured ? "ring-1 ring-brand-500/40" : ""
              }`}
            >
              {t.badge ? (
                <span className="absolute -top-2.5 right-6 rounded-full bg-brand-500 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-ink-950 shadow-[var(--shadow-brand-glow)]">
                  {t.badge}
                </span>
              ) : null}
              <header className="hairline-b pb-5">
                <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-400">
                  {t.name}
                </p>
                <p className="mt-3 font-display text-4xl font-bold leading-none tracking-[-0.02em] text-ink-50">
                  {t.price}
                </p>
                <p className="mt-1.5 text-sm text-ink-400">{t.cadence}</p>
              </header>
              <p className="mt-5 text-sm text-ink-300">{t.description}</p>
              <ul className="mt-5 space-y-3">
                {t.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2.5 text-sm text-ink-200"
                  >
                    <svg
                      aria-hidden
                      className="mt-0.5 h-4 w-4 shrink-0 text-brand-400"
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
              <div className="mt-auto pt-7">
                <ButtonLink
                  href={t.cta.href}
                  variant={t.cta.variant}
                  size="md"
                  arrow
                  className="w-full"
                >
                  {t.cta.label}
                </ButtonLink>
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
