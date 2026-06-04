"use client"

import { useId } from "react"
import type { ComparePlayer } from "@/lib/data/compare"

type Props = {
  a: ComparePlayer
  b: ComparePlayer
}

type Axis = {
  key: string
  label: string
  max: number
  pick: (p: ComparePlayer) => number | null
}

const AXES: Axis[] = [
  { key: "scoring", label: "Anotación", max: 32, pick: (p) => num(p.stats?.points) },
  { key: "playmaking", label: "Asistencias", max: 11, pick: (p) => num(p.stats?.assists) },
  { key: "rebounding", label: "Rebote", max: 13, pick: (p) => num(p.stats?.rebounds) },
  {
    key: "defense",
    label: "Defensa",
    max: 4.5,
    pick: (p) => sumOrNull(num(p.stats?.steals), num(p.stats?.blocks)),
  },
  {
    key: "efficiency",
    label: "FG%",
    max: 0.65,
    pick: (p) => num(p.stats?.fgPct),
  },
  {
    key: "range",
    label: "3P%",
    max: 0.5,
    pick: (p) => num(p.stats?.threePct),
  },
]

const CX = 200
const CY = 200
const R = 130

function num(v: number | null | undefined): number | null {
  if (v == null || !Number.isFinite(v)) return null
  return v
}

function sumOrNull(a: number | null, b: number | null): number | null {
  if (a == null && b == null) return null
  return (a ?? 0) + (b ?? 0)
}

function pointFor(i: number, value: number) {
  const angle = (Math.PI * 2 * i) / AXES.length - Math.PI / 2
  return [CX + Math.cos(angle) * R * value, CY + Math.sin(angle) * R * value] as const
}

function polygonFromValues(values: number[]) {
  return values
    .map((v, i) => {
      const [x, y] = pointFor(i, v)
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`
    })
    .concat("Z")
    .join(" ")
}

function clamp01(v: number): number {
  if (!Number.isFinite(v)) return 0
  return Math.min(1, Math.max(0, v))
}

export function CompareRadar({ a, b }: Props) {
  const aId = useId()
  const bId = useId()
  const aValues = AXES.map((ax) => {
    const raw = ax.pick(a)
    return raw == null ? 0 : clamp01(raw / ax.max)
  })
  const bValues = AXES.map((ax) => {
    const raw = ax.pick(b)
    return raw == null ? 0 : clamp01(raw / ax.max)
  })

  return (
    <div className="relative h-full w-full">
      <svg
        viewBox="0 0 400 400"
        role="img"
        aria-label={`Comparativa multi-stat entre ${a.fullName} y ${b.fullName}`}
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-full"
      >
        <defs>
          <linearGradient id={aId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--color-brand-400)" stopOpacity="0.65" />
            <stop offset="100%" stopColor="var(--color-brand-500)" stopOpacity="0.15" />
          </linearGradient>
          <linearGradient id={bId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--color-accent-cyan)" stopOpacity="0.6" />
            <stop offset="100%" stopColor="var(--color-accent-cyan)" stopOpacity="0.1" />
          </linearGradient>
        </defs>

        {[0.25, 0.5, 0.75, 1].map((tick) => (
          <polygon
            key={tick}
            points={AXES.map((_, i) => {
              const angle = (Math.PI * 2 * i) / AXES.length - Math.PI / 2
              return `${CX + Math.cos(angle) * R * tick},${CY + Math.sin(angle) * R * tick}`
            }).join(" ")}
            fill="none"
            stroke="var(--color-ink-700)"
            strokeWidth="0.6"
            strokeDasharray="2 4"
            opacity="0.5"
          />
        ))}

        {AXES.map((_, i) => {
          const angle = (Math.PI * 2 * i) / AXES.length - Math.PI / 2
          return (
            <line
              key={i}
              x1={CX}
              y1={CY}
              x2={CX + Math.cos(angle) * R}
              y2={CY + Math.sin(angle) * R}
              stroke="var(--color-ink-700)"
              strokeWidth="0.5"
              opacity="0.5"
            />
          )
        })}

        <path d={polygonFromValues(aValues)} fill={`url(#${aId})`} />
        <path
          d={polygonFromValues(aValues)}
          fill="none"
          stroke="var(--color-brand-400)"
          strokeWidth="2"
          strokeLinejoin="round"
        />

        <path d={polygonFromValues(bValues)} fill={`url(#${bId})`} />
        <path
          d={polygonFromValues(bValues)}
          fill="none"
          stroke="var(--color-accent-cyan)"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeDasharray="4 4"
        />

        {AXES.map((axis, i) => {
          const angle = (Math.PI * 2 * i) / AXES.length - Math.PI / 2
          const lx = CX + Math.cos(angle) * (R + 26)
          const ly = CY + Math.sin(angle) * (R + 26)
          return (
            <text
              key={axis.label}
              x={lx}
              y={ly}
              fontSize="11"
              textAnchor="middle"
              dominantBaseline="middle"
              fill="var(--color-ink-200)"
              fontFamily="var(--font-mono)"
            >
              {axis.label}
            </text>
          )
        })}

        {AXES.map((axis, i) => {
          const [px, py] = pointFor(i, aValues[i])
          return (
            <circle
              key={`a-${axis.label}`}
              cx={px}
              cy={py}
              r="3"
              fill="var(--color-brand-300)"
            />
          )
        })}

        {AXES.map((axis, i) => {
          const [px, py] = pointFor(i, bValues[i])
          return (
            <circle
              key={`b-${axis.label}`}
              cx={px}
              cy={py}
              r="3"
              fill="var(--color-accent-cyan)"
            />
          )
        })}
      </svg>

      <div className="absolute left-3 top-3 flex items-center gap-3 text-[11px] font-medium text-ink-200">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-brand-400" />
          <span className="max-w-[100px] truncate sm:max-w-[140px]">{a.fullName}</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-accent-cyan" />
          <span className="max-w-[100px] truncate sm:max-w-[140px]">{b.fullName}</span>
        </span>
      </div>
    </div>
  )
}

export default CompareRadar
