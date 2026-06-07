"use client"

import { useRef } from "react"
import { useScrollProgress } from "@/hooks/use-scroll-progress"
import type { CSSProperties, SVGProps } from "react"

type CourtPerspectiveProps = SVGProps<SVGSVGElement> & {
  scrollClassName?: string
  ballClassName?: string
}

const TRAJECTORY = "M 60 360 Q 320 60 540 200"
const TRAJECTORY_LEN = 720

export function CourtPerspective({
  className,
  scrollClassName,
  ballClassName,
  ...props
}: CourtPerspectiveProps) {
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const p = useScrollProgress(wrapRef)
  const eased = Math.min(1, Math.max(0, (p - 0.05) / 0.9))
  const easedTrail = Math.min(1, eased * 1.05)
  const trailDash = TRAJECTORY_LEN * (1 - easedTrail)
  const ballX = 60 + easedTrail * (540 - 60)
  const ballY =
    360 - Math.sin(easedTrail * Math.PI) * 300 + (1 - easedTrail) * 0
  const wrapStyle: CSSProperties = {
    transform: `perspective(900px) rotateX(${16 + eased * 6}deg) translateY(${eased * -8}px)`,
    transformStyle: "preserve-3d",
  }
  const trailStyle: CSSProperties = {
    strokeDasharray: TRAJECTORY_LEN,
    strokeDashoffset: trailDash,
    transition: "stroke-dashoffset 0.12s linear",
  }

  return (
    <div
      ref={wrapRef}
      className={`relative h-full w-full ${scrollClassName ?? ""}`}
      style={wrapStyle}
    >
      <svg
        viewBox="0 0 600 420"
        role="img"
        aria-label="Animated basketball court with a shot trajectory"
        xmlns="http://www.w3.org/2000/svg"
        className={`h-full w-full ${className ?? ""}`}
        {...props}
      >
        <defs>
          <linearGradient id="cpFloor" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-court-700)" />
            <stop offset="100%" stopColor="var(--color-court-950)" />
          </linearGradient>
          <linearGradient id="cpLine" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0%"
              stopColor="var(--color-paper-50)"
              stopOpacity="0.95"
            />
            <stop
              offset="100%"
              stopColor="var(--color-paper-100)"
              stopOpacity="0.55"
            />
          </linearGradient>
          <linearGradient id="cpTrail" x1="0" y1="1" x2="1" y2="0">
            <stop
              offset="0%"
              stopColor="var(--color-brand-500)"
              stopOpacity="0"
            />
            <stop
              offset="20%"
              stopColor="var(--color-brand-400)"
              stopOpacity="0.9"
            />
            <stop
              offset="80%"
              stopColor="var(--color-accent-magenta)"
              stopOpacity="0.95"
            />
            <stop
              offset="100%"
              stopColor="var(--color-accent-cyan)"
              stopOpacity="0"
            />
          </linearGradient>
          <radialGradient id="cpGlow" cx="0.5" cy="0.5" r="0.5">
            <stop
              offset="0%"
              stopColor="var(--color-brand-400)"
              stopOpacity="0.55"
            />
            <stop
              offset="100%"
              stopColor="var(--color-brand-500)"
              stopOpacity="0"
            />
          </radialGradient>
          <radialGradient id="cpBall" cx="0.35" cy="0.35" r="0.75">
            <stop offset="0%" stopColor="var(--color-brand-300)" />
            <stop offset="55%" stopColor="var(--color-brand-500)" />
            <stop offset="100%" stopColor="var(--color-brand-800)" />
          </radialGradient>
        </defs>

        <rect
          x="0"
          y="0"
          width="600"
          height="420"
          rx="18"
          fill="url(#cpFloor)"
        />

        <g stroke="url(#cpLine)" strokeWidth="1.5" fill="none" opacity="0.85">
          <rect x="20" y="20" width="560" height="380" rx="10" />
          <line x1="300" y1="20" x2="300" y2="400" strokeDasharray="6 6" />
          <circle cx="300" cy="210" r="58" />
          <path d="M 80 100 Q 80 210 80 320" />
          <path d="M 520 100 Q 520 210 520 320" />
        </g>

        <g
          stroke="var(--color-brand-400)"
          strokeWidth="2"
          fill="none"
          opacity="0.95"
        >
          <path d="M 80 100 A 110 110 0 0 1 80 320" />
          <path d="M 520 100 A 110 110 0 0 0 520 320" />
        </g>

        <g>
          <rect
            x="20"
            y="160"
            width="40"
            height="100"
            fill="none"
            stroke="url(#cpLine)"
            strokeWidth="1.5"
            opacity="0.85"
          />
          <rect
            x="540"
            y="160"
            width="40"
            height="100"
            fill="none"
            stroke="url(#cpLine)"
            strokeWidth="1.5"
            opacity="0.85"
          />
        </g>

        <g>
          <circle
            cx="80"
            cy="210"
            r="14"
            fill="none"
            stroke="var(--color-brand-300)"
            strokeWidth="2"
          />
          <line
            x1="70"
            y1="200"
            x2="70"
            y2="220"
            stroke="var(--color-brand-300)"
            strokeWidth="2"
          />
          <circle
            cx="520"
            cy="210"
            r="14"
            fill="none"
            stroke="var(--color-brand-300)"
            strokeWidth="2"
          />
          <line
            x1="530"
            y1="200"
            x2="530"
            y2="220"
            stroke="var(--color-brand-300)"
            strokeWidth="2"
          />
        </g>

        <g>
          <line
            x1="60"
            y1="360"
            x2="540"
            y2="200"
            stroke="url(#cpTrail)"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
            style={trailStyle}
          />
          <line
            x1="60"
            y1="360"
            x2="540"
            y2="200"
            stroke="var(--color-brand-300)"
            strokeWidth="1.2"
            strokeLinecap="round"
            fill="none"
            opacity="0.6"
            style={trailStyle}
            strokeDasharray="3 7"
          />
        </g>

        <g
          className={ballClassName}
          style={{
            transform: `translate(${ballX - 540}px, ${ballY - 200}px)`,
            transition: "transform 0.12s linear",
          }}
        >
          <circle cx="540" cy="200" r="34" fill="url(#cpGlow)" />
          <circle
            cx="540"
            cy="200"
            r="18"
            fill="url(#cpBall)"
            stroke="var(--color-court-950)"
            strokeWidth="1.2"
          />
          <path
            d="M 522 200 L 558 200"
            stroke="var(--color-court-950)"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          <path
            d="M 540 182 C 528 192 528 208 540 218"
            stroke="var(--color-court-950)"
            strokeWidth="1.4"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 540 182 C 552 192 552 208 540 218"
            stroke="var(--color-court-950)"
            strokeWidth="1.4"
            strokeLinecap="round"
            fill="none"
          />
        </g>
      </svg>
    </div>
  )
}

export default CourtPerspective
