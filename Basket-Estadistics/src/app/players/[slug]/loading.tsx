export default function PlayerLoading() {
  return (
    <div className="py-6 sm:py-10" aria-busy="true" aria-live="polite">
      <div className="mb-5 h-4 w-32 animate-pulse rounded bg-white/5 sm:mb-6" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr] lg:gap-8">
        <aside className="space-y-4">
          <div className="mx-auto aspect-square w-44 animate-pulse rounded-2xl border border-white/5 bg-white/[0.04] sm:w-56 lg:w-full" />
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
            <div className="h-3 w-12 animate-pulse rounded bg-white/10" />
            <div className="mt-4 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="h-3 w-16 animate-pulse rounded bg-white/10" />
                  <div className="h-3 w-20 animate-pulse rounded bg-white/10" />
                </div>
              ))}
            </div>
          </div>
        </aside>

        <div className="space-y-6 sm:space-y-8">
          <div>
            <div className="h-3 w-40 animate-pulse rounded bg-white/10" />
            <div className="mt-3 h-9 w-2/3 animate-pulse rounded bg-white/10 sm:h-12" />
            <div className="mt-3 h-4 w-1/2 animate-pulse rounded bg-white/10" />
          </div>

          <section>
            <div className="mb-3 h-3 w-24 animate-pulse rounded bg-white/10" />
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-white/5 bg-white/[0.02] p-4"
                >
                  <div className="h-2.5 w-12 animate-pulse rounded bg-white/10" />
                  <div className="mt-2 h-7 w-16 animate-pulse rounded bg-white/10" />
                  <div className="mt-1 h-3 w-10 animate-pulse rounded bg-white/10" />
                </div>
              ))}
            </div>
          </section>

          <section>
            <div className="mb-3 h-3 w-20 animate-pulse rounded bg-white/10" />
            <div className="space-y-3 rounded-xl border border-white/5 bg-white/[0.02] p-4 sm:p-5">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i}>
                  <div className="mb-1 h-3 w-12 animate-pulse rounded bg-white/10" />
                  <div className="h-1.5 w-full animate-pulse rounded-full bg-white/5" />
                </div>
              ))}
            </div>
          </section>

          <section>
            <div className="mb-3 h-3 w-28 animate-pulse rounded bg-white/10" />
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-12 animate-pulse rounded-xl border border-white/5 bg-white/[0.02]"
                />
              ))}
            </div>
          </section>

          <div className="aspect-video w-full animate-pulse rounded-xl border border-white/5 bg-white/[0.02]" />
        </div>
      </div>
    </div>
  )
}
