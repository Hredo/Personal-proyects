import { cn } from "@/components/ui/cn"

export type LeagueAccent = {
  color: string
  text: string
  glow: string
  short: string
}

const ACCENTS: Record<string, LeagueAccent> = {
  nba: {
    color: "var(--color-league-nba-500)",
    text: "var(--color-league-nba-300)",
    glow: "var(--shadow-league-nba)",
    short: "NBA",
  },
  euroleague: {
    color: "var(--color-league-euro-500)",
    text: "var(--color-league-euro-300)",
    glow: "var(--shadow-league-euro)",
    short: "EUR",
  },
  acb: {
    color: "var(--color-league-acb-500)",
    text: "var(--color-league-acb-300)",
    glow: "var(--shadow-league-acb)",
    short: "ACB",
  },
  "leb-oro": {
    color: "oklch(0.76 0.13 85)",
    text: "oklch(0.82 0.11 85)",
    glow: "0 0 44px -10px oklch(0.76 0.13 85 / 0.5)",
    short: "ORO",
  },
  "leb-plata": {
    color: "oklch(0.74 0.02 240)",
    text: "oklch(0.82 0.02 240)",
    glow: "0 0 44px -10px oklch(0.74 0.02 240 / 0.45)",
    short: "PLA",
  },
  eba: {
    color: "oklch(0.7 0.11 200)",
    text: "oklch(0.78 0.1 200)",
    glow: "0 0 44px -10px oklch(0.7 0.11 200 / 0.45)",
    short: "EBA",
  },
}

const FALLBACK: LeagueAccent = {
  color: "var(--color-brand-500)",
  text: "var(--color-brand-300)",
  glow: "var(--shadow-brand-glow)",
  short: "—",
}

export function leagueAccent(slug: string): LeagueAccent {
  return ACCENTS[slug] ?? FALLBACK
}

export function LeagueDot({
  slug,
  className,
}: {
  slug: string
  className?: string
}) {
  const a = leagueAccent(slug)
  return (
    <span
      aria-hidden
      className={cn("inline-block h-1.5 w-1.5 shrink-0 rounded-full", className)}
      style={{ background: a.color }}
    />
  )
}

export function LeagueBadge({
  slug,
  name,
  className,
}: {
  slug: string
  name: string
  className?: string
}) {
  const a = leagueAccent(slug)
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-hairline bg-white/[0.04] px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-ink-200 backdrop-blur",
        className,
      )}
    >
      <span
        aria-hidden
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: a.color }}
      />
      {name}
    </span>
  )
}
