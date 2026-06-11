"use client"

import type { ComparePlayer, CompareStats } from "@/lib/data/compare"

type Props = {
  a: ComparePlayer
  b: ComparePlayer
}

type StatRow = {
  label: string
  getValue: (s: CompareStats) => number | null
  fmt: (n: number) => string
  higherBetter?: boolean
  isPct?: boolean
}

type StatGroup = {
  label: string
  rows: StatRow[]
}

function perGame(total: number | null, gp: number): number | null {
  if (total == null || gp === 0) return null
  return total / gp
}

function pct(made: number | null, att: number | null): number | null {
  if (made == null || att == null || att === 0) return null
  return made / att
}

const GROUPS: StatGroup[] = [
  {
    label: "Scoring",
    rows: [
      {
        label: "Points / G",
        getValue: (s) => perGame(s.pointsTotal, s.gamesPlayed),
        fmt: (n) => n.toFixed(1),
      },
      {
        label: "FG%",
        getValue: (s) => pct(s.fgMade, s.fgAttempted),
        fmt: (n) => `${(n * 100).toFixed(1)}%`,
        isPct: true,
      },
      {
        label: "3P%",
        getValue: (s) => pct(s.threeMade, s.threeAttempted),
        fmt: (n) => `${(n * 100).toFixed(1)}%`,
        isPct: true,
      },
      {
        label: "FT%",
        getValue: (s) => pct(s.ftMade, s.ftAttempted),
        fmt: (n) => `${(n * 100).toFixed(1)}%`,
        isPct: true,
      },
    ],
  },
  {
    label: "Rebounding",
    rows: [
      {
        label: "Rebounds / G",
        getValue: (s) => perGame(s.reboundsTotal, s.gamesPlayed),
        fmt: (n) => n.toFixed(1),
      },
      {
        label: "Off. Reb / G",
        getValue: (s) => perGame(s.offensiveRebounds, s.gamesPlayed),
        fmt: (n) => n.toFixed(1),
      },
      {
        label: "Def. Reb / G",
        getValue: (s) => perGame(s.defensiveRebounds, s.gamesPlayed),
        fmt: (n) => n.toFixed(1),
      },
    ],
  },
  {
    label: "Playmaking",
    rows: [
      {
        label: "Assists / G",
        getValue: (s) => perGame(s.assistsTotal, s.gamesPlayed),
        fmt: (n) => n.toFixed(1),
      },
      {
        label: "Fouls / G",
        getValue: (s) => perGame(s.foulsTotal, s.gamesPlayed),
        fmt: (n) => n.toFixed(1),
      },
    ],
  },
  {
    label: "Defense",
    rows: [
      {
        label: "Steals / G",
        getValue: (s) => perGame(s.stealsTotal, s.gamesPlayed),
        fmt: (n) => n.toFixed(1),
      },
      {
        label: "Blocks / G",
        getValue: (s) => perGame(s.blocksTotal, s.gamesPlayed),
        fmt: (n) => n.toFixed(1),
      },
    ],
  },
  {
    label: "Hustle",
    rows: [
      {
        label: "Fouls / G",
        getValue: (s) => perGame(s.foulsTotal, s.gamesPlayed),
        fmt: (n) => n.toFixed(1),
        higherBetter: false,
      },
    ],
  },
  {
    label: "Efficiency",
    rows: [
      {
        label: "PER",
        getValue: (s) => s.per,
        fmt: (n) => n.toFixed(1),
      },
      {
        label: "Minutes / G",
        getValue: (s) => perGame(s.minutesTotal, s.gamesPlayed),
        fmt: (n) => n.toFixed(1),
      },
      {
        label: "+/-",
        getValue: (s) => perGame(s.plusMinus, s.gamesPlayed),
        fmt: (n) => {
          const sign = n >= 0 ? "+" : ""
          return `${sign}${n.toFixed(1)}`
        },
      },
    ],
  },
]

function compareValues(a: number | null, b: number | null, higherBetter: boolean): "a" | "b" | "tie" | "n/a" {
  if (a == null && b == null) return "n/a"
  if (a == null) return "b"
  if (b == null) return "a"
  const diff = higherBetter ? a - b : b - a
  if (Math.abs(diff) < 0.001) return "tie"
  return diff > 0 ? "a" : "b"
}

export function CompareStatsTable({ a, b }: Props) {
  const aName = a.fullName
  const bName = b.fullName

  return (
    <div className="w-full">
      <div className="mb-3 grid grid-cols-[1fr_auto_auto_auto] gap-x-3 gap-y-1 px-1 text-[10px] font-mono uppercase tracking-widest text-ink-500">
        <div />
        <div className="text-right">{aName}</div>
        <div className="w-6 text-center" />
        <div className="text-left">{bName}</div>
      </div>
      {GROUPS.map((group) => (
        <GroupSection
          key={group.label}
          group={group}
          aStats={a.stats}
          bStats={b.stats}
        />
      ))}
      <div className="mt-3 grid grid-cols-[1fr_auto_auto_auto] gap-x-3 gap-y-1 px-1 text-[10px] font-mono uppercase tracking-widest text-ink-500">
        <div />
        <div className="text-right">{aName}</div>
        <div className="w-6 text-center" />
        <div className="text-left">{bName}</div>
      </div>
    </div>
  )
}

function GroupSection({
  group,
  aStats,
  bStats,
}: {
  group: StatGroup
  aStats: CompareStats | null
  bStats: CompareStats | null
}) {
  return (
    <div className="mb-2">
      <div className="mb-1 flex items-center gap-2 px-1">
        <span className="h-px flex-1 bg-white/5" />
        <span className="text-[10px] font-mono uppercase tracking-widest text-ink-400">
          {group.label}
        </span>
        <span className="h-px flex-1 bg-white/5" />
      </div>
      <div className="space-y-px">
        {group.rows.map((row) => {
          const av = aStats ? row.getValue(aStats) : null
          const bv = bStats ? row.getValue(bStats) : null
          const winner = compareValues(av, bv, row.higherBetter ?? true)
          return (
            <div
              key={row.label}
              className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 items-center rounded-md px-2 py-1.5 text-[13px] transition-colors hover:bg-white/[0.02]"
            >
              <span className="text-ink-300">{row.label}</span>
              <div className="flex flex-col items-end gap-0.5">
                <span
                  className={`font-mono tabular-nums ${
                    winner === "a" ? "text-brand-300 font-semibold" : "text-ink-200"
                  }`}
                >
                  {av != null ? row.fmt(av) : "—"}
                </span>
                {row.isPct && av != null ? (
                  <div className="h-1 w-12 overflow-hidden rounded-full bg-white/5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-300 transition-all"
                      style={{ width: `${Math.min(av * 100, 100)}%` }}
                    />
                  </div>
                ) : null}
              </div>
              <span className="w-6 text-center text-[10px] text-ink-500">
                {winner === "a"
                  ? "▲"
                  : winner === "b"
                    ? "▼"
                    : winner === "tie"
                      ? "—"
                      : ""}
              </span>
              <div className="flex flex-col items-start gap-0.5">
                <span
                  className={`font-mono tabular-nums ${
                    winner === "b" ? "text-accent-cyan font-semibold" : "text-ink-200"
                  }`}
                >
                  {bv != null ? row.fmt(bv) : "—"}
                </span>
                {row.isPct && bv != null ? (
                  <div className="h-1 w-12 overflow-hidden rounded-full bg-white/5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-accent-cyan to-cyan-300 transition-all"
                      style={{ width: `${Math.min(bv * 100, 100)}%` }}
                    />
                  </div>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
