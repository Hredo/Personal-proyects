"use client"

import { useRef } from "react"
import { useScrollProgress } from "@/hooks/use-scroll-progress"
import type { CSSProperties, SVGProps } from "react"

type Bar = {
  league: string
  accent: "brand" | "cyan" | "magenta"
  values: { ppg: number; rpg: number; apg: number; fg: number; threeP: number }
}

const BARS: Bar[] = [
  {
    league: "NBA",
    accent: "brand",
    values: { ppg: 100, rpg: 64, apg: 76, fg: 65, threeP: 47 },
  },
  {
    league: "EuroLeague",
    accent: "cyan",
    values: { ppg: 78, rpg: 58, apg: 62, fg: 58, threeP: 41 },
  },
  {
    league: "ACB",
    accent: "magenta",
    values: { ppg: 74, rpg: 55, apg: 58, fg: 55, threeP: 38 },
  },
]

const METRICS: {
  key: keyof Bar["values"]
  label: string
  max: number
  unit: string
}[] = [
  { key: "ppg", label: "Points", max: 28, unit: "/g" },
  { key: "rpg", label: "Rebounds", max: 12, unit: "/g" },
  { key: "apg", label: "Assists", max: 9, unit: "/g" },
  { key: "fg", label: "FG%", max: 100, unit: "%" },
  { key: "threeP", label: "3P%", max: 100, unit: "%" },
]

const W = 520
const H = 360
const PAD_LEFT = 44
const PAD_RIGHT = 16
const PAD_TOP = 24
const PAD_BOTTOM = 36
const GROUP_GAP = 18
const BAR_GAP = 4
const innerW = W - PAD_LEFT - PAD_RIGHT
const innerH = H - PAD_TOP - PAD_BOTTOM
const groupW = (innerW - GROUP_GAP * (METRICS.length - 1)) / METRICS.length
const barW = (groupW - BAR_GAP * (BARS.length - 1)) / BARS.length

function accentVar(accent: Bar["accent"]) {
  if (accent === "brand") return "var(--color-brand-400)"
  if (accent === "cyan") return "var(--color-accent-cyan)"
  return "var(--color-accent-magenta)"
}

export function AnimatedBars(props: SVGProps<SVGSVGElement>) {
  const ref = useRef<HTMLDivElement | null>(null)
  const p = useScrollProgress(ref)
  const t = Math.min(1, Math.max(0, (p - 0.1) / 0.8))
  const eased = 1 - Math.pow(1 - t, 3)

  return (
    <div ref={ref} className="relative h-full w-full">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="League averages bar chart"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-full"
        {...props}
      >
        <defs>
          {BARS.map((b) => (
            <linearGradient
              key={b.league}
              id={`bar-${b.league}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="0%"
                stopColor={accentVar(b.accent)}
                stopOpacity="0.95"
              />
              <stop
                offset="100%"
                stopColor={accentVar(b.accent)}
                stopOpacity="0.25"
              />
            </linearGradient>
          ))}
        </defs>

        <g>
          {[0.25, 0.5, 0.75, 1].map((tick) => {
            const y = PAD_TOP + innerH * (1 - tick)
            return (
              <g key={tick}>
                <line
                  x1={PAD_LEFT}
                  x2={W - PAD_RIGHT}
                  y1={y}
                  y2={y}
                  stroke="var(--color-ink-700)"
                  strokeWidth="0.5"
                  strokeDasharray="2 4"
                  opacity="0.6"
                />
                <text
                  x={PAD_LEFT - 8}
                  y={y + 3}
                  fontSize="9"
                  textAnchor="end"
                  fill="var(--color-ink-400)"
                  fontFamily="var(--font-mono)"
                >
                  {Math.round(tick * 100)}%
                </text>
              </g>
            )
          })}
        </g>

        {METRICS.map((m, i) => {
          const gx = PAD_LEFT + i * (groupW + GROUP_GAP)
          return (
            <g key={m.key}>
              {BARS.map((b, j) => {
                const v = b.values[m.key]
                const h = (v / m.max) * innerH * eased
                const y = PAD_TOP + innerH - h
                const x = gx + j * (barW + BAR_GAP)
                return (
                  <rect
                    key={b.league}
                    x={x}
                    y={y}
                    width={barW}
                    height={h}
                    fill={`url(#bar-${b.league})`}
                    rx="2"
                    style={
                      {
                        transition: "all 0.15s ease-out",
                      } as CSSProperties
                    }
                  />
                )
              })}
              <text
                x={gx + groupW / 2}
                y={H - PAD_BOTTOM + 18}
                fontSize="10"
                textAnchor="middle"
                fill="var(--color-ink-300)"
                fontFamily="var(--font-mono)"
              >
                {m.label}
              </text>
            </g>
          )
        })}

        <g
          style={
            {
              opacity: eased > 0.5 ? 1 : 0,
              transition: "opacity 0.3s ease",
            } as CSSProperties
          }
        >
          {BARS.map((b, j) => {
            const x =
              PAD_LEFT +
              (METRICS.length - 1) * (groupW + GROUP_GAP) +
              8 +
              j * 70
            return (
              <g key={b.league}>
                <rect
                  x={x}
                  y={6}
                  width="10"
                  height="10"
                  rx="2"
                  fill={accentVar(b.accent)}
                />
                <text
                  x={x + 14}
                  y={14}
                  fontSize="10"
                  fill="var(--color-ink-200)"
                  fontFamily="var(--font-sans)"
                >
                  {b.league}
                </text>
              </g>
            )
          })}
        </g>
      </svg>
    </div>
  )
}

export default AnimatedBars
