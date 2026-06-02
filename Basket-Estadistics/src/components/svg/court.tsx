import type { SVGProps } from "react"

export function Court(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 500 280"
      role="img"
      aria-label="Basketball court"
      preserveAspectRatio="xMidYMid meet"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <defs>
        <linearGradient id="courtFloor" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--color-court-700)" />
          <stop offset="100%" stopColor="var(--color-court-900)" />
        </linearGradient>
        <linearGradient id="courtLine" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-paper-50)" stopOpacity="0.95" />
          <stop offset="100%" stopColor="var(--color-paper-100)" stopOpacity="0.75" />
        </linearGradient>
      </defs>
      <rect
        x="10"
        y="10"
        width="480"
        height="260"
        rx="10"
        fill="url(#courtFloor)"
        stroke="url(#courtLine)"
        strokeWidth="2"
      />
      <line
        x1="250"
        y1="10"
        x2="250"
        y2="270"
        stroke="url(#courtLine)"
        strokeWidth="2"
        strokeDasharray="6 6"
        opacity="0.6"
      />
      <circle
        cx="250"
        cy="140"
        r="48"
        fill="none"
        stroke="url(#courtLine)"
        strokeWidth="2"
        opacity="0.7"
      />
      <g opacity="0.9">
        <path
          d="M70 60 Q70 140 70 220"
          fill="none"
          stroke="url(#courtLine)"
          strokeWidth="2"
        />
        <line
          x1="70"
          y1="100"
          x2="135"
          y2="100"
          stroke="url(#courtLine)"
          strokeWidth="2"
        />
        <line
          x1="70"
          y1="180"
          x2="135"
          y2="180"
          stroke="url(#courtLine)"
          strokeWidth="2"
        />
        <path
          d="M135 100 A40 40 0 0 1 135 180"
          fill="none"
          stroke="url(#courtLine)"
          strokeWidth="2"
        />
        <circle
          cx="135"
          cy="140"
          r="22"
          fill="none"
          stroke="url(#courtLine)"
          strokeWidth="2"
        />
        <line
          x1="135"
          y1="118"
          x2="135"
          y2="162"
          stroke="url(#courtLine)"
          strokeWidth="2"
        />
        <circle
          cx="115"
          cy="140"
          r="8"
          fill="none"
          stroke="var(--color-brand-400)"
          strokeWidth="2"
        />
        <line
          x1="105"
          y1="132"
          x2="125"
          y2="132"
          stroke="var(--color-brand-400)"
          strokeWidth="2"
        />
      </g>
      <g opacity="0.9" transform="translate(500 0) scale(-1 1)">
        <path
          d="M70 60 Q70 140 70 220"
          fill="none"
          stroke="url(#courtLine)"
          strokeWidth="2"
        />
        <line
          x1="70"
          y1="100"
          x2="135"
          y2="100"
          stroke="url(#courtLine)"
          strokeWidth="2"
        />
        <line
          x1="70"
          y1="180"
          x2="135"
          y2="180"
          stroke="url(#courtLine)"
          strokeWidth="2"
        />
        <path
          d="M135 100 A40 40 0 0 1 135 180"
          fill="none"
          stroke="url(#courtLine)"
          strokeWidth="2"
        />
        <circle
          cx="135"
          cy="140"
          r="22"
          fill="none"
          stroke="url(#courtLine)"
          strokeWidth="2"
        />
        <line
          x1="135"
          y1="118"
          x2="135"
          y2="162"
          stroke="url(#courtLine)"
          strokeWidth="2"
        />
        <circle
          cx="115"
          cy="140"
          r="8"
          fill="none"
          stroke="var(--color-brand-400)"
          strokeWidth="2"
        />
        <line
          x1="105"
          y1="132"
          x2="125"
          y2="132"
          stroke="var(--color-brand-400)"
          strokeWidth="2"
        />
      </g>
    </svg>
  )
}

export default Court
