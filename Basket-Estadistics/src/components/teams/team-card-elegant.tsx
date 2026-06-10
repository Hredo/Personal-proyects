"use client"

import Link from "next/link"
import { SmartImage } from "@/components/ui/smart-image"
import { leagueAccent } from "@/components/ui/league-badge"
import { useSpotlight } from "@/components/animations/spotlight-card"
import { getInitials } from "@/lib/format"

type Props = {
  team: {
    id: string
    name: string
    slug: string
    logoUrl: string | null
    city: string | null
    league: { id: string; name: string; slug: string; region: string }
    playerCount: number
  }
}

export function TeamCardElegant({ team }: Props) {
  const initials = getInitials(team.name, 3)
  const league = leagueAccent(team.league.slug)
  const accent = league.color
  const { ref, onPointerMove } = useSpotlight<HTMLAnchorElement>()

  return (
    <Link
      ref={ref}
      onPointerMove={onPointerMove}
      href={`/teams/${team.league.slug}/${team.slug}`}
      className="gh-card gh-card-interactive gh-spotlight group relative flex h-full flex-col overflow-hidden"
      style={{ ["--lg" as string]: accent }}
    >
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 z-10 h-[3px] opacity-60 transition-opacity duration-500 group-hover:opacity-100"
        style={{ background: "var(--lg)" }}
      />
      <div
        className="relative aspect-[5/3] w-full overflow-hidden"
        style={{
          backgroundImage: `radial-gradient(ellipse at 50% 30%, color-mix(in oklch, ${accent} 22%, transparent) 0%, transparent 68%)`,
        }}
      >
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(circle_at_50%_125%,_oklch(0.09_0.022_48/0.7),_transparent_60%)]"
        />
        {team.logoUrl ? (
          <SmartImage
            src={team.logoUrl}
            alt={team.name}
            fit="contain"
            className="relative h-full w-full p-8 transition-transform duration-700 ease-fluid group-hover:scale-[1.07]"
            fallbackClassName="text-3xl font-bold text-ink-300"
            fallback={initials}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-display text-3xl font-bold text-ink-300">
            {initials}
          </div>
        )}
        <span className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-ink-950/55 px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-100 ring-1 ring-hairline backdrop-blur">
          <span
            aria-hidden
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: "var(--lg)" }}
          />
          {team.league.name}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4 hairline-t">
        <div>
          <h3 className="truncate font-display text-base font-bold tracking-[-0.01em] text-ink-50 sm:text-lg">
            {team.name}
          </h3>
          {team.city || team.league.region ? (
            <p className="mt-0.5 truncate text-xs text-ink-400">
              {team.city ?? team.league.region}
            </p>
          ) : null}
        </div>

        <div className="mt-auto flex items-end justify-between">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-ink-500">
              Roster
            </p>
            <p className="font-display text-lg font-bold tabular-nums text-ink-50">
              {team.playerCount}{" "}
              <span className="text-sm font-medium text-ink-400">
                {team.playerCount === 1 ? "player" : "players"}
              </span>
            </p>
          </div>
          <span
            aria-hidden
            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.04] text-ink-400 ring-1 ring-hairline transition-all duration-300 ease-fluid group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-ink-50"
          >
            <svg
              className="h-3.5 w-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M7 17 17 7M9 7h8v8" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  )
}
