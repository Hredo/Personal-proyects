import Link from "next/link"
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

export async function Footer() {
  const lastSync = await getLatestSyncTime()
  return (
    <footer className="mt-16 border-t border-white/5 sm:mt-24">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 text-sm text-ink-300 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-8">
        <div className="flex flex-col gap-1">
          <p>
            © {new Date().getFullYear()} {SITE.name}
          </p>
          <p className="flex items-center gap-2 text-xs text-ink-400">
            <span
              aria-hidden
              className={`relative inline-flex h-1.5 w-1.5 rounded-full ${
                lastSync ? "bg-accent-lime" : "bg-ink-500"
              }`}
            >
              {lastSync ? (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-lime opacity-60" />
              ) : null}
            </span>
            {lastSync
              ? `Last sync: ${formatRelative(lastSync)}`
              : "Data sync not yet observed"}
          </p>
        </div>
        <nav
          aria-label="Footer"
          className="flex flex-wrap items-center gap-x-4 gap-y-2 sm:gap-x-5"
        >
          <Link href="/players" className="transition hover:text-brand-300">
            Players
          </Link>
          <Link href="/teams" className="transition hover:text-brand-300">
            Teams
          </Link>
          <Link href="/coaches" className="transition hover:text-brand-300">
            Coaches
          </Link>
          <Link href="/compare" className="transition hover:text-brand-300">
            Compare
          </Link>
          <Link href="/leagues" className="transition hover:text-brand-300">
            Leagues
          </Link>
          <Link href="/ai-advisor" className="transition hover:text-brand-300">
            AI Advisor
          </Link>
          <span className="hidden h-4 w-px bg-white/10 sm:inline-block" />
          <Link href="/terms" className="transition hover:text-brand-300">
            Terms
          </Link>
          <Link href="/privacy" className="transition hover:text-brand-300">
            Privacy
          </Link>
          <a
            href={`mailto:${SITE.contact}`}
            className="transition hover:text-brand-300"
          >
            Contact
          </a>
        </nav>
      </div>
    </footer>
  )
}
