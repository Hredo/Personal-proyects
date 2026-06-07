import Link from "next/link"
import type { Metadata } from "next"
import { SITE } from "@/lib/site"

export const metadata: Metadata = {
  title: "Page not found",
  description: "That page does not exist (yet).",
  robots: { index: false, follow: false },
}

export default function NotFound() {
  return (
    <div className="relative flex min-h-[70vh] items-center justify-center px-4 py-16 sm:py-24">
      <div
        aria-hidden
        className="absolute inset-0 -z-20 bg-grid-fade opacity-50"
      />
      <div
        aria-hidden
        className="absolute left-1/2 top-1/3 -z-10 h-72 w-[640px] -translate-x-1/2 rounded-full bg-brand-500/20 blur-3xl sm:h-96 sm:w-[900px]"
      />
      <div className="relative mx-auto max-w-xl text-center">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-brand-300 sm:text-sm">
          404 · {SITE.shortName}
        </p>
        <h1 className="mt-4 font-display text-4xl font-bold leading-[1.05] tracking-tight text-ink-50 sm:text-5xl md:text-6xl">
          We couldn&apos;t find{" "}
          <span className="text-gradient-brand">that page.</span>
        </h1>
        <p className="mt-4 text-sm text-ink-200 sm:text-base">
          The link may be broken, the player may have moved teams, or the season
          is still being indexed. Try one of these instead.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
          <Link
            href="/players"
            className="inline-flex items-center justify-center gap-2 rounded-md bg-brand-500 px-5 py-3 text-sm font-semibold text-ink-950 shadow-[var(--shadow-brand-glow)] transition hover:bg-brand-400 sm:text-base"
          >
            Browse players
          </Link>
          <Link
            href="/compare"
            className="inline-flex items-center justify-center gap-2 rounded-md border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-ink-50 transition hover:border-brand-400/60 hover:text-brand-200 sm:text-base"
          >
            Open the compare console
          </Link>
        </div>
        <p className="mt-6 text-xs text-ink-400">
          Lost?{" "}
          <Link href="/" className="underline hover:text-brand-300">
            Back to home
          </Link>
        </p>
      </div>
    </div>
  )
}
