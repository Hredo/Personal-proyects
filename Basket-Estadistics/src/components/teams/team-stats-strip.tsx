export type Stats = {
  year: number
  gamesPlayed: number
  wins: number | null
  losses: number | null
  position: number | null
  pointsFor: number | null
  pointsAgainst: number | null
}

type Props = { stats: Stats }

function formatNumber(n: number | null, digits = 1): string {
  if (n == null) return "—"
  return n.toFixed(digits)
}

export function TeamStatsStrip({ stats }: Props) {
  const wins = stats.wins ?? 0
  const losses = stats.losses ?? 0
  const winPct = stats.gamesPlayed > 0 ? (wins / stats.gamesPlayed) * 100 : null
  return (
    <div className="team-stats-strip grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-5">
      <Tile
        label="Record"
        value={`${wins}-${losses}`}
        sub={`Season ${stats.year}`}
        accent
      />
      <Tile
        label="Win %"
        value={winPct != null ? `${winPct.toFixed(1)}%` : "—"}
      />
      <Tile
        label="Position"
        value={stats.position != null ? `#${stats.position}` : "—"}
      />
      <Tile label="PPG" value={formatNumber(stats.pointsFor)} />
      <Tile label="OPP PPG" value={formatNumber(stats.pointsAgainst)} />
    </div>
  )
}

function Tile({
  label,
  value,
  sub,
  accent = false,
}: {
  label: string
  value: string
  sub?: string
  accent?: boolean
}) {
  return (
    <div
      className="team-stats-tile rounded-xl border px-3 py-2.5"
      style={
        accent
          ? {
              borderColor:
                "color-mix(in oklch, var(--team-500) 45%, transparent)",
              background:
                "color-mix(in oklch, var(--team-500) 10%, rgba(255,255,255,0.02))",
            }
          : {
              borderColor: "rgba(255,255,255,0.06)",
              background: "rgba(255,255,255,0.02)",
            }
      }
    >
      <p className="text-[10px] uppercase tracking-widest text-ink-400">
        {label}
      </p>
      <p
        className="mt-0.5 font-display text-xl font-bold"
        style={
          accent
            ? { color: "var(--team-200)" }
            : { color: "var(--color-ink-50, #f5f5f5)" }
        }
      >
        {value}
      </p>
      {sub ? <p className="font-mono text-[10px] text-ink-500">{sub}</p> : null}
    </div>
  )
}
