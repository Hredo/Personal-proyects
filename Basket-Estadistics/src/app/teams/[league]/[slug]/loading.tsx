export default function TeamLoading() {
  return (
    <div className="py-8" aria-busy="true" aria-live="polite">
      <div className="mb-6 h-4 w-32 animate-pulse rounded bg-white/5" />

      <header className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-7">
          <div className="h-20 w-20 animate-pulse rounded-xl border border-white/5 bg-white/[0.04] sm:h-24 sm:w-24" />
          <div className="flex-1 space-y-3">
            <div className="h-3 w-32 animate-pulse rounded bg-white/10" />
            <div className="h-9 w-2/3 animate-pulse rounded bg-white/10 sm:h-12" />
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-6 w-20 animate-pulse rounded-full border border-white/5 bg-white/[0.04]"
                />
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-white/5 bg-white/[0.02] p-3"
            >
              <div className="h-2.5 w-12 animate-pulse rounded bg-white/10" />
              <div className="mt-2 h-7 w-16 animate-pulse rounded bg-white/10" />
            </div>
          ))}
        </div>
      </header>

      <section className="mt-8">
        <div className="mb-4 h-4 w-28 animate-pulse rounded bg-white/10" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-white/5 bg-white/[0.02] p-4"
            >
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 animate-pulse rounded-lg bg-white/5" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-24 animate-pulse rounded bg-white/10" />
                  <div className="h-2.5 w-14 animate-pulse rounded bg-white/10" />
                </div>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-1">
                <div className="h-6 animate-pulse rounded bg-white/5" />
                <div className="h-6 animate-pulse rounded bg-white/5" />
                <div className="h-6 animate-pulse rounded bg-white/5" />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-4 h-4 w-24 animate-pulse rounded bg-white/10" />
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-12 animate-pulse rounded-xl border border-white/5 bg-white/[0.02]"
            />
          ))}
        </div>
      </section>
    </div>
  )
}
