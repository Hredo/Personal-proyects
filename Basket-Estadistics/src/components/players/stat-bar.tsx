type Props = {
  label: string
  value: number | null | undefined
  max: number
  format?: (n: number) => string
}

export function StatBar({ label, value, max, format }: Props) {
  const v = value ?? 0
  const pct = Math.min(100, Math.max(0, (v / max) * 100))
  const display = value == null ? "—" : format ? format(value) : value.toFixed(1)
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-semibold uppercase tracking-wider text-ink-300">
          {label}
        </span>
        <span className="font-mono text-ink-100">{display}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-300"
          style={{ width: `${pct}%`, transition: "width 600ms ease-out" }}
        />
      </div>
    </div>
  )
}
