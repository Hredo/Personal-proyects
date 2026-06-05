export default function CompareLoading() {
  return (
    <div className="py-8 sm:py-10" aria-busy="true" aria-live="polite">
      <div className="mb-6 space-y-3">
        <div className="h-3 w-20 animate-pulse rounded bg-white/10" />
        <div className="h-9 w-1/2 animate-pulse rounded bg-white/10 sm:h-12" />
        <div className="h-3 w-2/3 animate-pulse rounded bg-white/10" />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 sm:p-5"
          >
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="h-14 w-14 animate-pulse rounded-lg bg-white/5 sm:h-16 sm:w-16" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 animate-pulse rounded bg-white/10" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-white/10" />
                <div className="h-2.5 w-1/3 animate-pulse rounded bg-white/10" />
              </div>
            </div>
            <div className="mt-3 h-3 w-1/2 animate-pulse rounded bg-white/10" />
          </div>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:mt-8 sm:gap-6 md:grid-cols-[1fr_auto_1fr] md:items-stretch">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-white/5 bg-white/[0.02] p-5"
          >
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 animate-pulse rounded-xl bg-white/5" />
              <div className="flex-1 space-y-2">
                <div className="h-5 w-3/4 animate-pulse rounded bg-white/10" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-white/10" />
                <div className="h-2.5 w-1/3 animate-pulse rounded bg-white/10" />
              </div>
            </div>
            <div className="mt-4 h-3 w-1/2 animate-pulse rounded bg-white/10" />
          </div>
        ))}
      </div>

      <section className="mt-6 rounded-2xl border border-white/5 bg-white/[0.02] p-4 sm:mt-8 sm:p-6">
        <div className="mb-4 h-4 w-40 animate-pulse rounded bg-white/10" />
        <div className="space-y-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i}>
              <div className="mb-1 flex items-center justify-between">
                <div className="h-3 w-20 animate-pulse rounded bg-white/10" />
                <div className="h-3 w-16 animate-pulse rounded bg-white/10" />
              </div>
              <div className="space-y-1">
                <div className="h-2 w-full animate-pulse rounded-full bg-white/5" />
                <div className="h-2 w-full animate-pulse rounded-full bg-white/5" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
