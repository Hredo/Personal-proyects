type Props = {
  label: string
  value: number | null | undefined
  max: number
  format?: (n: number) => string
  hint?: string
}

function defaultFormat(n: number): string {
  return `${(n * 100).toFixed(1)}%`
}

export function StatBar({ label, value, max, format, hint }: Props) {
  const isFallback = value == null
  const raw = isFallback ? 0 : (value as number)
  const safeMax = max > 0 ? max : 1
  const ratio = raw / safeMax
  const pct = isFallback
    ? 0
    : Math.min(100, Math.max(0, ratio * 100))
  const fmt = format ?? defaultFormat
  const display = isFallback ? "—" : fmt(raw)
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-semibold uppercase tracking-wider text-ink-300">
          {label}
        </span>
        <span className="flex items-center gap-2 font-mono text-ink-100">
          {hint ? (
            <span className="text-[10px] uppercase tracking-widest text-ink-500">
              {hint}
            </span>
          ) : null}
          <span className={isFallback ? "text-ink-400" : ""}>{display}</span>
        </span>
      </div>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/5">
        <div
          className={`h-full rounded-full ${
            isFallback
              ? "bg-white/10"
              : "bg-gradient-to-r from-brand-500 to-brand-300"
          }`}
          style={{ width: `${pct}%`, transition: "width 600ms ease-out" }}
        />
      </div>
    </div>
  )
}
