export default function AIAdvisorLoading() {
  return (
    <div className="py-8 sm:py-10" aria-busy="true" aria-live="polite">
      <div className="mb-6 space-y-3">
        <div className="h-3 w-24 animate-pulse rounded bg-white/10" />
        <div className="h-9 w-2/5 animate-pulse rounded bg-white/10 sm:h-12" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-white/10" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr]">
        <div className="hidden space-y-3 lg:block">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-2xl border border-white/5 bg-white/[0.02]"
            />
          ))}
        </div>
        <div className="flex min-h-[60vh] flex-col rounded-2xl border border-white/5 bg-white/[0.02] p-4 sm:p-6">
          <div className="flex-1 space-y-4">
            <div className="h-20 w-3/4 animate-pulse rounded-2xl bg-white/5" />
            <div className="ml-auto h-12 w-1/2 animate-pulse rounded-2xl bg-white/5" />
            <div className="h-24 w-2/3 animate-pulse rounded-2xl bg-white/5" />
          </div>
          <div className="mt-6 h-14 animate-pulse rounded-2xl bg-white/5" />
        </div>
      </div>
    </div>
  )
}
