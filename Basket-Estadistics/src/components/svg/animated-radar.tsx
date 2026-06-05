"use client"

import { useRef } from "react"
import { useScrollProgress } from "@/hooks/use-scroll-progress"
import type { CSSProperties, SVGProps } from "react"

type RadarProps = SVGProps<SVGSVGElement> & {
  aLabel?: string
  bLabel?: string
}

const AXES = [
  { label: "Scoring", a: 0.92, b: 0.78 },
  { label: "Playmaking", a: 0.71, b: 0.88 },
  { label: "Rebounding", a: 0.58, b: 0.74 },
  { label: "Defense", a: 0.82, b: 0.69 },
  { label: "Efficiency", a: 0.86, b: 0.81 },
  { label: "Range", a: 0.78, b: 0.72 },
]

const CX = 200
const CY = 200
const R = 150

function point(i: number, value: number) {
  const angle = (Math.PI * 2 * i) / AXES.length - Math.PI / 2
  return [
    CX + Math.cos(angle) * R * value,
    CY + Math.sin(angle) * R * value,
  ] as const
}

function polygonPath(values: number[]) {
  return values
    .map((v, i) => {
      const [x, y] = point(i, v)
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`
    })
    .concat("Z")
    .join(" ")
}

export function AnimatedRadar({
  aLabel = "Player A",
  bLabel = "Player B",
  className,
  ...props
}: RadarProps) {
  const ref = useRef<HTMLDivElement | null>(null)
  const p = useScrollProgress(ref)
  const t = Math.min(1, Math.max(0, (p - 0.1) / 0.75))
  const eased = 1 - Math.pow(1 - t, 3)
  const aPath = polygonPath(AXES.map((x) => x.a * eased))
  const bPath = polygonPath(AXES.map((x) => x.b * eased))
  const aFill = polygonPath(AXES.map((x) => x.a * eased * 0.6))
  const bFill = polygonPath(AXES.map((x) => x.b * eased * 0.6))

  return (
    <div ref={ref} className="relative h-full w-full">
      <svg
        viewBox="0 0 400 400"
        role="img"
        aria-label="Player comparison radar chart"
        xmlns="http://www.w3.org/2000/svg"
        className={`h-full w-full ${className ?? ""}`}
        {...props}
      >
        <defs>
          <linearGradient id="radar-a" x1="0" y1="0" x2="1" y2="1">
            <stop
              offset="0%"
              stopColor="var(--color-brand-400)"
              stopOpacity="0.7"
            />
            <stop
              offset="100%"
              stopColor="var(--color-brand-500)"
              stopOpacity="0.15"
            />
          </linearGradient>
          <linearGradient id="radar-b" x1="0" y1="0" x2="1" y2="1">
            <stop
              offset="0%"
              stopColor="var(--color-accent-cyan)"
              stopOpacity="0.65"
            />
            <stop
              offset="100%"
              stopColor="var(--color-accent-cyan)"
              stopOpacity="0.1"
            />
          </linearGradient>
        </defs>

        {[0.25, 0.5, 0.75, 1].map((tick) => (
          <polygon
            key={tick}
            points={AXES.map((_, i) => {
              const a = (Math.PI * 2 * i) / AXES.length - Math.PI / 2
              return `${CX + Math.cos(a) * R * tick},${CY + Math.sin(a) * R * tick}`
            }).join(" ")}
            fill="none"
            stroke="var(--color-ink-700)"
            strokeWidth="0.6"
            strokeDasharray="2 4"
            opacity="0.5"
          />
        ))}

        {AXES.map((_, i) => {
          const a = (Math.PI * 2 * i) / AXES.length - Math.PI / 2
          return (
            <line
              key={i}
              x1={CX}
              y1={CY}
              x2={CX + Math.cos(a) * R}
              y2={CY + Math.sin(a) * R}
              stroke="var(--color-ink-700)"
              strokeWidth="0.6"
              opacity="0.6"
            />
          )
        })}

        <path d={aFill} fill="url(#radar-a)" />
        <path
          d={aPath}
          fill="none"
          stroke="var(--color-brand-400)"
          strokeWidth="2"
          strokeLinejoin="round"
          style={
            {
              transition: "all 0.12s ease-out",
            } as CSSProperties
          }
        />
        <path d={bFill} fill="url(#radar-b)" />
        <path
          d={bPath}
          fill="none"
          stroke="var(--color-accent-cyan)"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeDasharray="4 4"
          style={
            {
              transition: "all 0.12s ease-out",
            } as CSSProperties
          }
        />

        {AXES.map((axis, i) => {
          const a = (Math.PI * 2 * i) / AXES.length - Math.PI / 2
          const lx = CX + Math.cos(a) * (R + 22)
          const ly = CY + Math.sin(a) * (R + 22)
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
              style={
                {
                  opacity: eased > 0.6 ? 1 : 0,
                  transition: "opacity 0.2s ease",
                } as CSSProperties
              }
            >
              {axis.label}
            </text>
          )
        })}

        {AXES.map((axis, i) => {
          const a = (Math.PI * 2 * i) / AXES.length - Math.PI / 2
          const [px, py] = point(i, axis.a * eased)
          return (
            <circle
              key={`a-${axis.label}`}
              cx={px}
              cy={py}
              r="3"
              fill="var(--color-brand-300)"
              style={
                {
                  opacity: eased > 0.3 ? 1 : 0,
                  transition: "opacity 0.2s ease",
                } as CSSProperties
              }
            />
          )
        })}

        {AXES.map((axis, i) => {
          const a = (Math.PI * 2 * i) / AXES.length - Math.PI / 2
          const [px, py] = point(i, axis.b * eased)
          return (
            <circle
              key={`b-${axis.label}`}
              cx={px}
              cy={py}
              r="3"
              fill="var(--color-accent-cyan)"
              style={
                {
                  opacity: eased > 0.3 ? 1 : 0,
                  transition: "opacity 0.2s ease",
                } as CSSProperties
              }
            />
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
          <rect
            x="20"
            y="20"
            width="10"
            height="10"
            rx="2"
            fill="var(--color-brand-400)"
          />
          <text
            x="34"
            y="29"
            fontSize="10"
            fill="var(--color-ink-200)"
            fontFamily="var(--font-sans)"
          >
            {aLabel}
          </text>
          <rect
            x={20 + aLabel.length * 6.4}
            y="20"
            width="10"
            height="10"
            rx="2"
            fill="var(--color-accent-cyan)"
          />
          <text
            x={34 + aLabel.length * 6.4}
            y="29"
            fontSize="10"
            fill="var(--color-ink-200)"
            fontFamily="var(--font-sans)"
          >
            {bLabel}
          </text>
        </g>
      </svg>
    </div>
  )
}

export default AnimatedRadar
