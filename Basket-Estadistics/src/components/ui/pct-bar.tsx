type PctBarProps = {
  value: number | null | undefined
  size?: "sm" | "md" | "lg"
  showLabel?: boolean
  label?: string
  className?: string
}

export function PctBar({
  value,
  size = "sm",
  showLabel = false,
  label,
  className = "",
}: PctBarProps) {
  if (value == null) {
    if (showLabel) {
      return (
        <div className={`flex flex-col gap-0.5 ${className}`}>
          {label ? (
            <span className="text-[9px] uppercase tracking-wider text-ink-500">
              {label}
            </span>
          ) : null}
          <span className="font-mono text-[11px] text-ink-400">—</span>
        </div>
      )
    }
    return <span className="font-mono text-[11px] text-ink-400">—</span>
  }

  const pct = value * 100
  const barHeight = size === "sm" ? "h-1.5" : size === "md" ? "h-2" : "h-2.5"
  const textSize =
    size === "sm"
      ? "text-[11px]"
      : size === "md"
        ? "text-xs"
        : "text-sm"

  return (
    <div className={`flex flex-col gap-0.5 ${className}`}>
      {showLabel && label ? (
        <span className="text-[9px] uppercase tracking-wider text-ink-500">
          {label}
        </span>
      ) : null}
      <div className="flex items-center gap-2">
        <div
          className={`flex-1 overflow-hidden rounded-full bg-white/5 ${barHeight}`}
        >
          <div
            className={`${barHeight} rounded-full bg-gradient-to-r from-brand-500 to-brand-300 transition-all duration-500`}
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>
        <span
          className={`shrink-0 font-mono font-semibold tabular-nums text-ink-100 ${textSize}`}
        >
          {pct.toFixed(1)}%
        </span>
      </div>
    </div>
  )
}
