export default function LeaguesLoading() {
  return (
    <div
      className="full-bleed relative pb-8 sm:pb-12"
      aria-busy="true"
      aria-live="polite"
    >
      <header className="pb-2 pt-10 sm:pt-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="h-3 w-28 animate-pulse rounded bg-white/10" />
          <div className="mt-4 h-14 w-72 animate-pulse rounded-lg bg-white/10 sm:h-16 md:h-20" />
          <div className="mt-5 space-y-2">
            <div className="h-3 w-96 max-w-full animate-pulse rounded bg-white/10" />
            <div className="h-3 w-64 animate-pulse rounded bg-white/10" />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mt-8 h-20 animate-pulse rounded-2xl border border-white/5 bg-white/[0.02]" />

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-white/5 bg-white/[0.02] p-5"
            >
              <div className="flex items-center justify-between">
                <div className="h-5 w-32 animate-pulse rounded bg-white/10" />
                <div className="h-8 w-8 animate-pulse rounded-full bg-white/5" />
              </div>
              <div className="mt-4 space-y-2.5">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="flex items-center gap-3">
                    <div className="h-9 w-9 animate-pulse rounded-full bg-white/5" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 w-2/3 animate-pulse rounded bg-white/10" />
                      <div className="h-2.5 w-1/3 animate-pulse rounded bg-white/10" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 h-9 animate-pulse rounded-xl bg-white/5" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
