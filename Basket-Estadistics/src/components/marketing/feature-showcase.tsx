import { FadeIn } from "@/components/animations/fade-in"
import { SectionHeading } from "@/components/ui/section-heading"
import { ButtonLink } from "@/components/ui/button"

type Feature = {
  n: string
  title: string
  body: string
  cta: { href: string; label: string }
  bullets: string[]
  visual: "compare" | "radar" | "shot"
}

const FEATURES: Feature[] = [
  {
    n: "01",
    title: "Cross-league compare",
    body: "Drop two names from any combination of NBA, EuroLeague or ACB and get radar, splits and per-game lines on the same scale.",
    cta: { href: "/compare", label: "Open the console" },
    bullets: [
      "Pace and possession normalized",
      "Radar overlays with color-coded deltas",
      "Shooting splits, advanced metrics and per-game",
    ],
    visual: "compare",
  },
  {
    n: "02",
    title: "League hubs with leaders",
    body: "Six leagues, one shelf. Current-season scoring leaders, roster and staff counts, and direct jumps into every directory.",
    cta: { href: "/leagues", label: "Browse leagues" },
    bullets: [
      "Top scorers per league, current season",
      "Roster and coaching-staff counts at a glance",
      "Quick links to the player and team directories",
    ],
    visual: "radar",
  },
  {
    n: "03",
    title: "AI advisor, trained on basketball",
    body: "Tell the advisor the role and the budget and it surfaces a shortlist with reasoning, not just a name dump.",
    cta: { href: "/ai-advisor", label: "Try the advisor" },
    bullets: [
      "Role-based filters (defender, shooter, organizer)",
      "Transparent reasoning on every recommendation",
      "Export to PDF, Excel and Word",
    ],
    visual: "shot",
  },
]

function CompareVisual() {
  return (
    <svg
      viewBox="0 0 320 200"
      className="h-full w-full"
      role="img"
      aria-label="Side-by-side player comparison mockup"
    >
      <defs>
        <linearGradient id="cg1" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="oklch(0.72 0.18 50)" />
          <stop offset="1" stopColor="oklch(0.58 0.22 25)" />
        </linearGradient>
        <linearGradient id="cg2" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="oklch(0.78 0.15 220)" />
          <stop offset="1" stopColor="oklch(0.52 0.2 260)" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="320" height="200" fill="transparent" />
      <g transform="translate(80 100)">
        <polygon
          points="0,-60 52,-30 52,30 0,60 -52,30 -52,-30"
          fill="url(#cg1)"
          fillOpacity="0.18"
          stroke="url(#cg1)"
          strokeWidth="1.4"
        />
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const a = (i * Math.PI) / 3 - Math.PI / 2
          return (
            <line
              key={i}
              x1={0}
              y1={0}
              x2={Math.cos(a) * 60}
              y2={Math.sin(a) * 60}
              stroke="white"
              strokeOpacity="0.08"
              strokeWidth="0.8"
            />
          )
        })}
      </g>
      <g transform="translate(240 100)">
        <polygon
          points="0,-60 52,-30 52,30 0,60 -52,30 -52,-30"
          fill="url(#cg2)"
          fillOpacity="0.18"
          stroke="url(#cg2)"
          strokeWidth="1.4"
        />
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const a = (i * Math.PI) / 3 - Math.PI / 2
          return (
            <line
              key={i}
              x1={0}
              y1={0}
              x2={Math.cos(a) * 60}
              y2={Math.sin(a) * 60}
              stroke="white"
              strokeOpacity="0.08"
              strokeWidth="0.8"
            />
          )
        })}
      </g>
      <line
        x1="160"
        y1="20"
        x2="160"
        y2="180"
        stroke="white"
        strokeOpacity="0.08"
        strokeDasharray="2 4"
      />
      <text
        x="80"
        y="20"
        textAnchor="middle"
        fill="oklch(0.92 0 0)"
        fontSize="9"
        fontFamily="monospace"
      >
        A · 32.4 PPG
      </text>
      <text
        x="240"
        y="20"
        textAnchor="middle"
        fill="oklch(0.92 0 0)"
        fontSize="9"
        fontFamily="monospace"
      >
        B · 18.1 PPG
      </text>
    </svg>
  )
}

function RadarVisual() {
  return (
    <svg
      viewBox="0 0 320 200"
      className="h-full w-full"
      role="img"
      aria-label="League leaderboard mockup"
    >
      <rect width="320" height="200" fill="transparent" />
      {[0, 1, 2].map((row) => (
        <g key={row} transform={`translate(20 ${30 + row * 44})`}>
          <rect
            width="280"
            height="32"
            rx="6"
            fill="white"
            fillOpacity="0.04"
          />
          <circle
            cx="16"
            cy="16"
            r="8"
            fill={`oklch(${0.7 - row * 0.06} 0.18 ${50 + row * 110})`}
          />
          <rect
            x="34"
            y="10"
            width={100 - row * 16}
            height="6"
            rx="3"
            fill="white"
            fillOpacity="0.18"
          />
          <rect
            x="34"
            y="20"
            width={60 - row * 10}
            height="4"
            rx="2"
            fill="white"
            fillOpacity="0.1"
          />
          <text
            x="266"
            y="20"
            textAnchor="end"
            fontSize="9"
            fill="white"
            fillOpacity="0.5"
            fontFamily="monospace"
          >
            {["32.4", "27.1", "30.4"][row]}
          </text>
        </g>
      ))}
      <text
        x="20"
        y="22"
        fontSize="9"
        fill="white"
        fillOpacity="0.4"
        fontFamily="monospace"
      >
        TOP SCORERS
      </text>
    </svg>
  )
}

function ShotVisual() {
  return (
    <svg
      viewBox="0 0 320 200"
      className="h-full w-full"
      role="img"
      aria-label="Shot chart mockup"
    >
      <defs>
        <linearGradient id="paint" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="oklch(0.32 0.07 55)" />
          <stop offset="1" stopColor="oklch(0.16 0.04 50)" />
        </linearGradient>
      </defs>
      <path
        d="M40 180 Q40 80 160 60 Q280 80 280 180 Z"
        fill="url(#paint)"
        opacity="0.4"
      />
      <path
        d="M140 60 a20 20 0 1 1 40 0 a20 20 0 1 1 -40 0"
        fill="none"
        stroke="white"
        strokeOpacity="0.3"
        strokeWidth="1.2"
      />
      <line
        x1="160"
        y1="60"
        x2="160"
        y2="180"
        stroke="white"
        strokeOpacity="0.2"
      />
      {[
        [120, 110, 8, 0.7],
        [180, 95, 6, 0.6],
        [220, 130, 10, 0.55],
        [105, 140, 7, 0.5],
        [195, 165, 9, 0.45],
        [150, 90, 5, 0.4],
        [250, 100, 6, 0.3],
        [85, 155, 7, 0.25],
      ].map(([x, y, r, op], i) => (
        <circle
          key={i}
          cx={x as number}
          cy={y as number}
          r={r as number}
          fill="oklch(0.72 0.18 50)"
          fillOpacity={op as number}
        />
      ))}
    </svg>
  )
}

function Visual({ kind }: { kind: Feature["visual"] }) {
  if (kind === "compare") return <CompareVisual />
  if (kind === "radar") return <RadarVisual />
  return <ShotVisual />
}

export function FeatureShowcase() {
  return (
    <section
      aria-label="Product features"
      className="relative hairline-t py-20 sm:py-28"
    >
      <FadeIn>
        <SectionHeading
          align="center"
          eyebrow="What's inside"
          title={
            <>
              One console.{" "}
              <span className="text-gradient-brand">Three workflows.</span>
            </>
          }
          description="Whether you're scouting a target, comparing cross-league prospects or just looking up a box score — same data, same math."
        />
      </FadeIn>

      <div className="mt-12 space-y-5 sm:space-y-6">
        {FEATURES.map((f, i) => {
          const reversed = i % 2 === 1
          return (
            <FadeIn key={f.n} delay={0.05 * (i + 1)} y={24}>
              <article className="gh-card relative grid items-stretch overflow-hidden md:grid-cols-2">
                <span
                  aria-hidden
                  className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-500/60 to-transparent"
                />
                <div
                  className={`p-6 sm:p-8 md:p-10 ${reversed ? "md:order-2" : "md:order-1"}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs uppercase tracking-[0.18em] text-brand-300">
                      {f.n}
                    </span>
                    <span className="h-px w-8 bg-hairline-strong" />
                  </div>
                  <h3 className="mt-4 font-display text-2xl font-bold leading-tight tracking-[-0.02em] text-ink-50 sm:text-3xl">
                    {f.title}
                  </h3>
                  <p className="mt-3 text-pretty text-sm leading-relaxed text-ink-300 sm:text-base">
                    {f.body}
                  </p>
                  <ul className="mt-5 space-y-2.5">
                    {f.bullets.map((b) => (
                      <li
                        key={b}
                        className="flex items-start gap-2.5 text-sm text-ink-200"
                      >
                        <svg
                          aria-hidden
                          className="mt-0.5 h-4 w-4 shrink-0 text-brand-400"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M5 13l4 4L19 7" />
                        </svg>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                  <ButtonLink
                    href={f.cta.href}
                    variant="secondary"
                    size="sm"
                    arrow
                    className="mt-7"
                  >
                    {f.cta.label}
                  </ButtonLink>
                </div>
                <div
                  className={`flex items-center justify-center bg-gradient-to-br from-white/[0.04] to-transparent p-6 hairline-b sm:p-8 md:p-10 md:border-b-0 ${
                    reversed
                      ? "md:order-1 md:border-r md:border-hairline"
                      : "md:order-2 md:border-l md:border-hairline"
                  }`}
                >
                  <div className="aspect-[16/10] w-full max-w-md rounded-xl border border-hairline bg-surface-0/60 p-3">
                    <Visual kind={f.visual} />
                  </div>
                </div>
              </article>
            </FadeIn>
          )
        })}
      </div>
    </section>
  )
}
