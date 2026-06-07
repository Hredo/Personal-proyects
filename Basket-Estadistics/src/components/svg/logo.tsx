import type { SVGProps } from "react"

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 64 64"
      role="img"
      aria-label="globalhoopstats logo"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <defs>
        <linearGradient id="logoBall" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--color-brand-300)" />
          <stop offset="55%" stopColor="var(--color-brand-500)" />
          <stop offset="100%" stopColor="var(--color-brand-700)" />
        </linearGradient>
        <linearGradient id="logoGlow" x1="0" y1="0" x2="0" y2="1">
          <stop
            offset="0%"
            stopColor="var(--color-brand-500)"
            stopOpacity="0.5"
          />
          <stop
            offset="100%"
            stopColor="var(--color-brand-700)"
            stopOpacity="0"
          />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="30" fill="url(#logoGlow)" />
      <circle
        cx="32"
        cy="32"
        r="26"
        fill="url(#logoBall)"
        stroke="var(--color-court-900)"
        strokeWidth="1.5"
      />
      <path
        d="M6 32 H58"
        stroke="var(--color-court-950)"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.75"
      />
      <path
        d="M32 6 C18 18 18 46 32 58"
        stroke="var(--color-court-950)"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.75"
      />
      <path
        d="M32 6 C46 18 46 46 32 58"
        stroke="var(--color-court-950)"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.75"
      />
      <text
        x="32"
        y="40"
        textAnchor="middle"
        fontFamily="var(--font-display)"
        fontWeight="800"
        fontSize="22"
        fill="var(--color-court-950)"
        letterSpacing="-1"
      >
        GH
      </text>
    </svg>
  )
}

export default Logo
