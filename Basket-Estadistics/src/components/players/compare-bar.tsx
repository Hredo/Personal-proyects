type Props = {
  label: string
  aName: string
  bName: string
  a: number | null
  b: number | null
  max: number
  fmt: (n: number) => string
  lowerBetter?: boolean
}

export function CompareBar({
  label,
  aName,
  bName,
  a,
  b,
  max,
  fmt,
  lowerBetter = false,
}: Props) {
  const aN = a ?? 0
  const bN = b ?? 0
  const aPct = Math.min(100, (aN / max) * 100)
  const bPct = Math.min(100, (bN / max) * 100)
  const aWins =
    a != null && b != null && (lowerBetter ? a < b : a > b)
  const bWins =
    a != null && b != null && (lowerBetter ? b < a : b > a)
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-semibold uppercase tracking-wider text-ink-300">
          {label}
        </span>
        <span className="font-mono text-ink-200">
          {a != null ? fmt(a) : "—"} <span className="text-ink-500">·</span>{" "}
          {b != null ? fmt(b) : "—"}
        </span>
      </div>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="w-32 truncate text-[10px] text-ink-400">{aName}</span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/5">
            <div
              className={`h-full rounded-full ${
                aWins
                  ? "bg-gradient-to-r from-accent-lime to-brand-400"
                  : "bg-brand-500/60"
              }`}
              style={{ width: `${aPct}%`, transition: "width 600ms ease-out" }}
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-32 truncate text-[10px] text-ink-400">{bName}</span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/5">
            <div
              className={`h-full rounded-full ${
                bWins
                  ? "bg-gradient-to-r from-accent-lime to-brand-400"
                  : "bg-brand-500/60"
              }`}
              style={{ width: `${bPct}%`, transition: "width 600ms ease-out" }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
