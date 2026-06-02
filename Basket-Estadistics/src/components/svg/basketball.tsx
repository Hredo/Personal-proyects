import type { SVGProps } from "react"

export function Basketball(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 100 100"
      role="img"
      aria-label="Basketball"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <defs>
        <radialGradient id="ballFill" cx="0.35" cy="0.35" r="0.75">
          <stop offset="0%" stopColor="var(--color-brand-300)" />
          <stop offset="55%" stopColor="var(--color-brand-500)" />
          <stop offset="100%" stopColor="var(--color-brand-800)" />
        </radialGradient>
        <radialGradient id="ballHighlight" cx="0.3" cy="0.25" r="0.3">
          <stop offset="0%" stopColor="white" stopOpacity="0.55" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle
        cx="50"
        cy="50"
        r="46"
        fill="url(#ballFill)"
        stroke="var(--color-court-950)"
        strokeWidth="1.5"
      />
      <circle cx="50" cy="50" r="46" fill="url(#ballHighlight)" />
      <path
        d="M4 50 H96"
        stroke="var(--color-court-950)"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M50 4 C28 22 28 78 50 96"
        stroke="var(--color-court-950)"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M50 4 C72 22 72 78 50 96"
        stroke="var(--color-court-950)"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}

export default Basketball
