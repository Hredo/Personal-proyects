import type { Metadata } from "next"
import Link from "next/link"
import { SITE } from "@/lib/site"

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Terms of service for globalhoopstats — the rules of the road for using the site and any future Pro tier.",
  alternates: { canonical: "/terms" },
  openGraph: {
    title: `Terms of Service · ${SITE.name}`,
    description:
      "Terms of service for globalhoopstats — the rules of the road for using the site and any future Pro tier.",
    url: `${SITE.url}/terms`,
    type: "article",
  },
}

export default function TermsPage() {
  const lastUpdated = "2026-06-05"
  return (
    <article className="prose-custom mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-2 text-sm text-ink-300 transition hover:text-brand-300"
      >
        ← Back to home
      </Link>
      <header className="mb-10">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-300 sm:text-[11px]">
          Legal
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-ink-50 sm:text-4xl md:text-5xl">
          Terms of Service
        </h1>
        <p className="mt-3 text-xs text-ink-400 sm:text-sm">
          Last updated: <time dateTime={lastUpdated}>{lastUpdated}</time>
        </p>
      </header>

      <Section title="1. Who we are">
        <p>
          {SITE.name} ({SITE.url}) is a basketball statistics and scouting
          console operated by Hugo Redondo Valdés ({SITE.contact}). By using the
          site you agree to these terms.
        </p>
      </Section>

      <Section title="2. What the service is">
        <p>
          The site aggregates public basketball data from the NBA, EuroLeague
          and Liga ACB, normalizes it across leagues, and lets you compare
          players, teams and coaches through a web interface and an AI advisor.
        </p>
        <p>
          The database, league hubs, the compare console and the AI advisor are
          free to use during the public beta. A paid Pro tier will be introduced
          later with shortlists, exports and persistent AI sessions.
        </p>
      </Section>

      <Section title="3. Data sources and accuracy">
        <p>
          All player, team and game data is sourced from the public feeds and
          APIs operated by each league and its partners. We do not invent
          statistics.
        </p>
        <p>
          Even so, the numbers can contain errors, delays or omissions. The
          service is provided <strong>as is</strong>, and{" "}
          <strong>
            we do not guarantee accuracy, completeness or fitness for any
            particular decision
          </strong>
          . Don&apos;t sign a player based on a single number — verify against
          the source league before acting.
        </p>
      </Section>

      <Section title="4. Acceptable use">
        <ul>
          <li>No scraping the site at industrial volume.</li>
          <li>No automated requests that bypass rate limits.</li>
          <li>
            No prompt-injection, jailbreaking or attempts to extract the system
            prompt of the AI advisor.
          </li>
          <li>
            No republishing the data behind a paywall or as if it were yours.
            Linking back to {SITE.name} is welcome.
          </li>
        </ul>
      </Section>

      <Section title="5. Pro tier (when it launches)">
        <p>
          When the Pro tier is open, paid features will be billed monthly or
          yearly. We will publish pricing on this page before charging anything.
          You can cancel at any time and we will stop billing at the end of the
          current period. Refunds are evaluated case by case under EU consumer
          law.
        </p>
      </Section>

      <Section title="6. Intellectual property">
        <p>
          The site code, design, normalizations, advanced-metric formulas and
          database schema are owned by us. League names, team logos and
          trademarks belong to their respective owners and are used for
          informational purposes only.
        </p>
      </Section>

      <Section title="7. Liability">
        <p>
          To the maximum extent permitted by law, {SITE.name} is not liable for
          any indirect, incidental or consequential damages arising from the use
          of the service.
        </p>
      </Section>

      <Section title="8. Jurisdiction">
        <p>
          These terms are governed by the laws of Spain. Any dispute will be
          resolved in the courts of Madrid, unless mandatory consumer law says
          otherwise.
        </p>
      </Section>

      <Section title="9. Contact">
        <p>
          Questions, complaints or takedown requests:{" "}
          <a
            href={`mailto:${SITE.contact}`}
            className="text-brand-300 underline hover:text-brand-200"
          >
            {SITE.contact}
          </a>
          . We aim to reply within five working days.
        </p>
      </Section>

      <p className="mt-10 text-xs text-ink-500">
        This document is a general template and is not legal advice. If you are
        launching a paid tier or operating in a regulated industry, please have
        a lawyer review it.
      </p>
    </article>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="mt-8">
      <h2 className="font-display text-xl font-semibold text-ink-50 sm:text-2xl">
        {title}
      </h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-ink-200 sm:text-[15px]">
        {children}
      </div>
    </section>
  )
}
