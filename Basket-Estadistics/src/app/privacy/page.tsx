import type { Metadata } from "next"
import Link from "next/link"
import { SITE } from "@/lib/site"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Privacy policy for globalhoopstats — what we collect, what we don't, and how to reach us.",
  alternates: { canonical: "/privacy" },
  openGraph: {
    title: `Privacy Policy · ${SITE.name}`,
    description:
      "Privacy policy for globalhoopstats — what we collect, what we don't, and how to reach us.",
    url: `${SITE.url}/privacy`,
    type: "article",
  },
}

export default function PrivacyPage() {
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
          Privacy Policy
        </h1>
        <p className="mt-3 text-xs text-ink-400 sm:text-sm">
          Last updated: <time dateTime={lastUpdated}>{lastUpdated}</time>
        </p>
      </header>

      <Section title="The short version">
        <ul>
          <li>We don&apos;t sell your data. We never will.</li>
          <li>We don&apos;t run third-party advertising trackers.</li>
          <li>
            The only personal data we hold today is the email you give us to
            join the waitlist.
          </li>
          <li>You can ask us to delete that email at any time.</li>
        </ul>
      </Section>

      <Section title="1. Who is the data controller">
        <p>
          Hugo Redondo Valdés ({SITE.contact}) operates {SITE.name} ({SITE.url}
          ). For any privacy question, write to{" "}
          <a
            href={`mailto:${SITE.contact}`}
            className="text-brand-300 underline hover:text-brand-200"
          >
            {SITE.contact}
          </a>
          .
        </p>
      </Section>

      <Section title="2. What we collect">
        <p>
          <strong>Waitlist signups.</strong> If you submit the waitlist form on
          the site, we store the email address you typed, the timestamp of the
          submission, and an optional source label (for example
          &quot;pricing&quot; or &quot;home&quot;). We use this to email you
          when the Pro tier opens and to count signups.
        </p>
        <p>
          <strong>AI advisor reactions.</strong> The AI advisor saves your
          thumbs-up / thumbs-down feedback for the last few messages in your
          browser&apos;s <code>localStorage</code>. This never leaves your
          device and is not sent to a server.
        </p>
        <p>
          <strong>Standard server logs.</strong> The hosting platform (Vercel or
          equivalent) records the request time, route, status code and a
          truncated IP for abuse and rate-limit purposes. These logs roll over
          and are not used to identify you personally.
        </p>
      </Section>

      <Section title="3. What we do NOT collect">
        <ul>
          <li>No advertising cookies.</li>
          <li>No third-party analytics with personal identifiers.</li>
          <li>
            No precise geolocation, device fingerprinting, or social-login data.
          </li>
          <li>No payment data — we have no checkout today.</li>
        </ul>
      </Section>

      <Section title="4. Where the data lives">
        <p>
          The waitlist table lives in a SQLite database on the server, with
          backups managed by the hosting provider. The hosting region is the EU.
          Waitlist notification emails (when enabled) are sent via Resend, a
          transactional email provider compliant with GDPR.
        </p>
      </Section>

      <Section title="5. Your rights">
        <p>You can always:</p>
        <ul>
          <li>Ask what we hold on you.</li>
          <li>Ask us to correct it.</li>
          <li>Ask us to delete it (right to be forgotten).</li>
          <li>Withdraw the consent you gave when you submitted the form.</li>
        </ul>
        <p>
          To exercise any of these, write to{" "}
          <a
            href={`mailto:${SITE.contact}`}
            className="text-brand-300 underline hover:text-brand-200"
          >
            {SITE.contact}
          </a>
          . We reply within five working days.
        </p>
      </Section>

      <Section title="6. Cookies">
        <p>
          We do not set marketing or analytics cookies. The site may set
          strictly necessary cookies for session and security (for example CSRF
          tokens if you sign in to Pro later).
        </p>
      </Section>

      <Section title="7. Children">
        <p>
          The service is aimed at professional and adult audiences. We do not
          knowingly collect data from anyone under 16.
        </p>
      </Section>

      <Section title="8. Changes to this policy">
        <p>
          If we change anything material, we will update the &quot;Last
          updated&quot; date at the top of this page. For substantial changes we
          will also email waitlist subscribers before they take effect.
        </p>
      </Section>

      <p className="mt-10 text-xs text-ink-500">
        This document is a general privacy policy and is not legal advice. If
        your situation is sensitive (children, health data, EU/UK
        representation) please have a DPO or lawyer review it.
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
