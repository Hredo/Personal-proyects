import Link from "next/link"
import { Logo } from "@/components/svg/logo"
import { SITE } from "@/lib/site"
import { getLatestSyncTime } from "@/lib/data/sync"

function formatRelative(d: Date): string {
  const diff = Date.now() - d.getTime()
  if (diff < 0) return "just now"
  const sec = Math.floor(diff / 1000)
  if (sec < 60) return `${sec}s ago`
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min} min ago`
  const hr = Math.floor(min / 60)
  if (hr < 48) return `${hr}h ago`
  const day = Math.floor(hr / 24)
  return `${day}d ago`
}

const EXPLORE = [
  { href: "/players", label: "Players" },
  { href: "/teams", label: "Teams" },
  { href: "/coaches", label: "Coaches" },
]

const TOOLS = [
  { href: "/compare", label: "Compare" },
  { href: "/leagues", label: "Leagues" },
  { href: "/ai-advisor", label: "AI Advisor" },
]

const LEGAL = [
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
]

export async function Footer() {
  const lastSync = await getLatestSyncTime()
  return (
    <footer className="relative mt-20 hairline-t sm:mt-28">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="flex flex-col gap-4">
            <Link
              href="/"
              className="flex items-center gap-2.5 text-ink-50"
              aria-label={`${SITE.name} — Home`}
            >
              <Logo className="h-8 w-8" />
              <span className="font-display text-lg font-bold tracking-[-0.02em]">
                globalhoopstats<span className="text-brand-500">.</span>
              </span>
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-ink-400">
              Cross-league basketball intelligence. Players, rosters and staff
              from the NBA, EuroLeague, ACB and Spain&apos;s FEB ladder — one
              language, one console.
            </p>
            <p className="mt-1 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-500">
              <span
                aria-hidden
                className={`relative inline-flex h-1.5 w-1.5 rounded-full ${
                  lastSync ? "bg-positive" : "bg-ink-600"
                }`}
              >
                {lastSync ? (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-positive opacity-60" />
                ) : null}
              </span>
              {lastSync ? `Synced ${formatRelative(lastSync)}` : "Sync pending"}
            </p>
          </div>

          <FooterColumn title="Explore" links={EXPLORE} />
          <FooterColumn title="Tools" links={TOOLS} />
          <FooterColumn title="Company" links={LEGAL} contact={SITE.contact} />
        </div>

        <div className="mt-12 flex flex-col gap-3 hairline-t pt-6 text-xs text-ink-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {SITE.name}. All rights reserved.
          </p>
          <p className="font-mono uppercase tracking-[0.16em]">
            NBA · EuroLeague · ACB · LEB Oro · LEB Plata · EBA
          </p>
        </div>
      </div>
    </footer>
  )
}

function FooterColumn({
  title,
  links,
  contact,
}: {
  title: string
  links: { href: string; label: string }[]
  contact?: string
}) {
  return (
    <div className="flex flex-col gap-3">
      <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-500">
        {title}
      </p>
      <nav className="flex flex-col gap-2.5 text-sm text-ink-300" aria-label={title}>
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="w-fit transition-colors duration-200 hover:text-brand-300"
          >
            {l.label}
          </Link>
        ))}
        {contact ? (
          <a
            href={`mailto:${contact}`}
            className="w-fit transition-colors duration-200 hover:text-brand-300"
          >
            Contact
          </a>
        ) : null}
      </nav>
    </div>
  )
}
