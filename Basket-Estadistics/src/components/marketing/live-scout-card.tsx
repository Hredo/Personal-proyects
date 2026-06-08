"use client"

import { motion, useReducedMotion } from "framer-motion"

const AXES = ["PTS", "AST", "REB", "STL", "TS%", "USG"]
const PLAYER_A = [0.94, 0.68, 0.52, 0.46, 0.84, 0.9]
const PLAYER_B = [0.66, 0.88, 0.82, 0.74, 0.64, 0.58]

const CX = 200
const CY = 200
const R = 132

function point(i: number, v: number): [number, number] {
  const ang = -Math.PI / 2 + i * (Math.PI / 3)
  return [CX + Math.cos(ang) * R * v, CY + Math.sin(ang) * R * v]
}
function polyPoints(vals: number[]): string {
  return vals.map((v, i) => point(i, v).join(",")).join(" ")
}
function labelPos(i: number): {
  x: number
  y: number
  anchor: "start" | "middle" | "end"
} {
  const [x, y] = point(i, 1.16)
  const anchor: "start" | "middle" | "end" =
    Math.abs(x - CX) < 8 ? "middle" : x > CX ? "start" : "end"
  return { x, y: y + 4, anchor }
}

const EASE = [0.19, 1, 0.22, 1] as const

export function LiveScoutCard() {
  const reduce = useReducedMotion()

  return (
    <div className="gh-bezel gh-sheen">
      <div className="gh-bezel-inner relative overflow-hidden">
        <div aria-hidden className="absolute inset-0 bg-dot-field opacity-50" />
        <div
          aria-hidden
          className="absolute -right-16 -top-16 h-48 w-48 animate-breathe rounded-full bg-brand-500/20 blur-3xl"
        />

        {/* header */}
        <div className="relative flex items-center justify-between px-4 pt-3.5 sm:px-5">
          <span className="inline-flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-300">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-positive opacity-70" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-positive" />
            </span>
            Live scout
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-500">
            radar · 6 axes
          </span>
        </div>

        {/* radar */}
        <div className="relative px-2 pb-1 pt-1">
          <svg
            viewBox="0 0 400 400"
            className="h-full w-full"
            role="img"
            aria-label="Animated scouting radar comparing two players across six metrics"
          >
            <defs>
              <radialGradient id="lsSweep" cx="0.5" cy="0.5" r="0.5">
                <stop offset="0%" stopColor="var(--color-brand-400)" stopOpacity="0.45" />
                <stop offset="100%" stopColor="var(--color-brand-400)" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="lsA" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="var(--color-brand-300)" />
                <stop offset="100%" stopColor="var(--color-ember-500)" />
              </linearGradient>
              <filter id="lsGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="4" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* concentric grid */}
            {[0.34, 0.67, 1].map((s) => (
              <polygon
                key={s}
                points={polyPoints(AXES.map(() => s))}
                fill="none"
                stroke="oklch(1 0 0 / 0.08)"
                strokeWidth="1"
              />
            ))}
            {/* axes + labels */}
            {AXES.map((ax, i) => {
              const [x, y] = point(i, 1)
              const lp = labelPos(i)
              return (
                <g key={ax}>
                  <line
                    x1={CX}
                    y1={CY}
                    x2={x}
                    y2={y}
                    stroke="oklch(1 0 0 / 0.08)"
                    strokeWidth="1"
                  />
                  <text
                    x={lp.x}
                    y={lp.y}
                    textAnchor={lp.anchor}
                    className="fill-ink-400 font-mono"
                    style={{ fontSize: 13, letterSpacing: "0.1em" }}
                  >
                    {ax}
                  </text>
                </g>
              )
            })}

            {/* rotating sonar sweep */}
            {!reduce ? (
              <g
                className="animate-spin-slow"
                style={{ transformOrigin: "200px 200px" } as React.CSSProperties}
              >
                <path
                  d={`M${CX},${CY} L${CX},${CY - R} A${R},${R} 0 0 1 ${
                    CX + Math.cos(-Math.PI / 2 + Math.PI / 4) * R
                  },${CY + Math.sin(-Math.PI / 2 + Math.PI / 4) * R} Z`}
                  fill="url(#lsSweep)"
                />
              </g>
            ) : null}

            {/* player B polygon (cyan) */}
            <motion.polygon
              points={polyPoints(PLAYER_B)}
              fill="color-mix(in oklch, var(--color-accent-cyan) 16%, transparent)"
              stroke="var(--color-accent-cyan)"
              strokeWidth="2"
              filter="url(#lsGlow)"
              initial={reduce ? false : { scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.9, ease: EASE, delay: 0.2 }}
              style={{ transformOrigin: "200px 200px" } as React.CSSProperties}
            />
            {/* player A polygon (brand) */}
            <motion.polygon
              points={polyPoints(PLAYER_A)}
              fill="color-mix(in oklch, var(--color-brand-500) 18%, transparent)"
              stroke="url(#lsA)"
              strokeWidth="2.5"
              filter="url(#lsGlow)"
              initial={reduce ? false : { scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.9, ease: EASE, delay: 0.35 }}
              style={{ transformOrigin: "200px 200px" } as React.CSSProperties}
            />
            {/* vertices */}
            {PLAYER_A.map((v, i) => {
              const [x, y] = point(i, v)
              return (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r="3.5"
                  className="fill-brand-300"
                  style={
                    reduce
                      ? undefined
                      : {
                          animation: `pulse-soft 3s ease-in-out ${i * 0.25}s infinite`,
                        }
                  }
                />
              )
            })}
          </svg>
        </div>

        {/* footer */}
        <div className="relative flex items-center justify-between gap-2 hairline-t px-4 py-2.5 sm:px-5">
          <span className="inline-flex items-center gap-2 text-[11px] text-ink-300">
            <span className="h-2 w-2 rounded-full bg-brand-500" />
            Player A
            <span className="ml-2 h-2 w-2 rounded-full bg-accent-cyan" />
            Player B
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-500">
            NBA · EUR · ACB
          </span>
        </div>
      </div>
    </div>
  )
}
