"use client"

import { useEffect } from "react"
import Link from "next/link"
import { SITE } from "@/lib/site"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[globalhoopstats] route error:", error)
  }, [error])

  return (
    <div className="relative flex min-h-[70vh] items-center justify-center px-4 py-16 sm:py-24">
      <div
        aria-hidden
        className="absolute inset-0 -z-20 bg-grid-fade opacity-50"
      />
      <div
        aria-hidden
        className="absolute left-1/2 top-1/3 -z-10 h-72 w-[640px] -translate-x-1/2 rounded-full bg-accent-magenta/20 blur-3xl sm:h-96 sm:w-[900px]"
      />
      <div className="relative mx-auto max-w-xl text-center">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent-magenta sm:text-sm">
          500 · Something broke
        </p>
        <h1 className="mt-4 font-display text-4xl font-bold leading-[1.05] tracking-tight text-ink-50 sm:text-5xl md:text-6xl">
          That didn&apos;t{" "}
          <span className="text-gradient-brand">go to plan.</span>
        </h1>
        <p className="mt-4 text-sm text-ink-200 sm:text-base">
          A render error happened on this page. We&apos;ve logged it. You can
          try again, head back home, or let us know what you were doing.
        </p>
        {error.digest ? (
          <p className="mt-3 font-mono text-[11px] text-ink-400">
            ref: {error.digest}
          </p>
        ) : null}
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-brand-500 px-5 py-3 text-sm font-semibold text-ink-950 shadow-[var(--shadow-brand-glow)] transition hover:bg-brand-400 sm:text-base"
          >
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-md border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-ink-50 transition hover:border-brand-400/60 hover:text-brand-200 sm:text-base"
          >
            Back to home
          </Link>
        </div>
        <p className="mt-6 text-xs text-ink-400">
          Still broken?{" "}
          <a
            href={`mailto:${SITE.contact}?subject=${encodeURIComponent("Bug report on " + SITE.name)}`}
            className="underline hover:text-brand-300"
          >
            Report it to {SITE.contact}
          </a>
        </p>
      </div>
    </div>
  )
}
