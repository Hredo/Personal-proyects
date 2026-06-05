type Split = {
  label: string
  a: number | null
  b: number | null
}

type Props = {
  aName: string
  bName: string
  splits: Split[]
}

const SIZE = 110
const STROKE = 10
const R = (SIZE - STROKE) / 2
const CIRC = 2 * Math.PI * R

function formatPct(v: number | null): string {
  if (v == null || !Number.isFinite(v)) return "—"
  return `${(v * 100).toFixed(1)}%`
}

function arc(value: number | null, color: string) {
  const v =
    value == null || !Number.isFinite(value)
      ? 0
      : Math.min(1, Math.max(0, value))
  const dash = CIRC * v
  return (
    <circle
      cx={SIZE / 2}
      cy={SIZE / 2}
      r={R}
      stroke={color}
      strokeWidth={STROKE}
      strokeLinecap="round"
      fill="none"
      strokeDasharray={`${dash} ${CIRC - dash}`}
      transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
      style={{ transition: "stroke-dasharray 600ms ease-out" }}
    />
  )
}

export function CompareShootingSplits({ aName, bName, splits }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {splits.map((s) => {
        const aWins = s.a != null && s.b != null && s.a > s.b + 0.001
        const bWins = s.a != null && s.b != null && s.b > s.a + 0.001
        return (
          <div
            key={s.label}
            className="rounded-xl border border-white/5 bg-white/[0.02] p-4 text-center"
          >
            <p className="font-mono text-[10px] uppercase tracking-widest text-ink-400">
              {s.label}
            </p>
            <div className="relative mx-auto mt-3 h-[110px] w-[110px]">
              <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="h-full w-full">
                <circle
                  cx={SIZE / 2}
                  cy={SIZE / 2}
                  r={R}
                  stroke="var(--color-ink-700)"
                  strokeWidth={STROKE}
                  fill="none"
                  opacity="0.4"
                />
                {arc(s.b, "var(--color-accent-cyan)")}
                {arc(s.a, "var(--color-brand-400)")}
              </svg>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display text-lg font-bold leading-none text-ink-50">
                  {formatPct(s.a)}
                </span>
                <span className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-ink-400">
                  vs {formatPct(s.b)}
                </span>
              </div>
            </div>
            <div className="mt-3 space-y-1 text-[11px]">
              <p
                className={`flex items-center justify-center gap-1.5 ${
                  aWins ? "text-brand-300" : "text-ink-300"
                }`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-brand-400" />
                <span className="max-w-[110px] truncate">{aName}</span>
              </p>
              <p
                className={`flex items-center justify-center gap-1.5 ${
                  bWins ? "text-accent-cyan" : "text-ink-300"
                }`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-accent-cyan" />
                <span className="max-w-[110px] truncate">{bName}</span>
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default CompareShootingSplits
