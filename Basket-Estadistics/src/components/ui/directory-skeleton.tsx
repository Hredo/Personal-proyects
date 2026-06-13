/**
 * Instant-feedback skeleton for the directory routes (/players, /teams,
 * /coaches…). Mirrors DirectoryHero + StickyFilterBar + card grid so the
 * page doesn't jump when real content streams in.
 */
export function DirectorySkeleton({ cards = 12 }: { cards?: number }) {
  return (
    <div
      className="full-bleed relative pb-10 sm:pb-14"
      aria-busy="true"
      aria-live="polite"
    >
      <header className="full-bleed relative isolate overflow-hidden pb-2 pt-10 sm:pt-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-col gap-7 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="h-3 w-40 animate-pulse rounded bg-white/10" />
              <div className="mt-4 h-14 w-64 animate-pulse rounded-lg bg-white/10 sm:h-16 sm:w-80 md:h-20" />
              <div className="mt-5 space-y-2">
                <div className="h-3 w-80 max-w-full animate-pulse rounded bg-white/10" />
                <div className="h-3 w-56 animate-pulse rounded bg-white/10" />
              </div>
            </div>
            <div className="flex shrink-0 items-end gap-8 pt-5 md:pt-0">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i}>
                  <div className="h-9 w-20 animate-pulse rounded bg-white/10" />
                  <div className="mt-2 h-2.5 w-24 animate-pulse rounded bg-white/10" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mt-6 h-14 animate-pulse rounded-2xl border border-white/5 bg-white/[0.02]" />

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {Array.from({ length: cards }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 sm:p-5"
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="h-14 w-14 animate-pulse rounded-xl bg-white/5 sm:h-16 sm:w-16" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 animate-pulse rounded bg-white/10" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-white/10" />
                  <div className="h-2.5 w-1/3 animate-pulse rounded bg-white/10" />
                </div>
              </div>
              <div className="mt-4 flex gap-4">
                <div className="h-3 w-14 animate-pulse rounded bg-white/10" />
                <div className="h-3 w-14 animate-pulse rounded bg-white/10" />
                <div className="h-3 w-14 animate-pulse rounded bg-white/10" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
