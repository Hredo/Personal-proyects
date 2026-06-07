"use client"

import Link from "next/link"
import { SmartImage } from "@/components/ui/smart-image"
import { getInitials } from "@/lib/format"

type LeagueAccent = { badge: string; color: string; text: string }

const LEAGUE_ACCENT: Record<string, LeagueAccent> = {
  nba: {
    badge: "bg-brand-500/15 text-brand-200 ring-brand-500/30",
    color: "var(--color-league-nba-500)",
    text: "var(--color-league-nba-300)",
  },
  euroleague: {
    badge: "bg-accent-cyan/10 text-accent-cyan ring-accent-cyan/30",
    color: "var(--color-league-euro-500)",
    text: "var(--color-accent-cyan)",
  },
  acb: {
    badge: "bg-league-acb-500/15 text-league-acb-300 ring-league-acb-500/30",
    color: "var(--color-league-acb-500)",
    text: "var(--color-league-acb-300)",
  },
}

const FALLBACK_ACCENT: LeagueAccent = {
  badge: "bg-white/8 text-ink-200 ring-white/15",
  color: "var(--color-brand-500)",
  text: "var(--color-brand-300)",
}

type Props = {
  player: {
    id: string
    fullName: string
    slug: string
    position: string | null
    photoUrl: string | null
    league: { id: string; name: string; slug: string; country: string }
    team: {
      id: string
      name: string
      slug: string
      logoUrl: string | null
    } | null
    stats: {
      year: number
      gamesPlayed: number
      points: number | null
      rebounds: number | null
      assists: number | null
    } | null
  }
  rank?: number
}

export function PlayerCardElegant({ player, rank }: Props) {
  const initials = getInitials(player.fullName)
  const s = player.stats
  const ppg = s?.points != null ? s.points.toFixed(1) : "—"
  const rpg = s?.rebounds != null ? s.rebounds.toFixed(1) : "—"
  const apg = s?.assists != null ? s.assists.toFixed(1) : "—"
  const accent = LEAGUE_ACCENT[player.league.slug] ?? FALLBACK_ACCENT

  return (
    <Link
      href={`/players/${player.slug}`}
      className="gh-card gh-card-interactive group relative flex h-full flex-col overflow-hidden"
      style={{
        ["--lg" as string]: accent.color,
        ["--lg-text" as string]: accent.text,
      }}
    >
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 z-10 h-[3px] opacity-70 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: "var(--lg)" }}
      />

      <div className="relative aspect-[4/5] w-full overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 z-[1] bg-gradient-to-t from-surface-1 via-surface-1/40 to-transparent"
        />
        <SmartImage
          src={player.photoUrl}
          alt={player.fullName}
          fit="cover"
          className="h-full w-full object-cover transition-transform duration-[600ms] ease-out group-hover:scale-[1.05]"
          fallbackClassName="bg-gradient-to-br from-court-800 via-court-900 to-ink-900 text-4xl font-bold text-ink-500"
          fallback={initials}
        />

        {rank != null ? (
          <span className="absolute left-3 top-3 z-[2] flex h-7 min-w-7 items-center justify-center rounded-md bg-ink-950/70 px-1.5 font-mono text-xs font-bold tabular-nums text-ink-100 ring-1 ring-white/10 backdrop-blur">
            {rank}
          </span>
        ) : null}

        <span
          className={`absolute right-3 top-3 z-[2] rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider ring-1 backdrop-blur ${accent.badge}`}
        >
          {player.league.name}
        </span>

        <div className="absolute inset-x-0 bottom-0 z-[2] flex items-end justify-between gap-2 p-4">
          <div className="min-w-0 flex-1">
            {player.position ? (
              <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-400">
                {player.position}
              </p>
            ) : null}
            <h3 className="truncate font-display text-lg font-bold leading-tight tracking-tight text-ink-50">
              {player.fullName}
            </h3>
            <p className="mt-0.5 truncate text-xs text-ink-300">
              {player.team?.name ?? "Free agent"}
            </p>
          </div>
          {player.team?.logoUrl ? (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md bg-ink-950/70 p-1 ring-1 ring-white/10 backdrop-blur">
              <SmartImage
                src={player.team.logoUrl}
                alt={player.team.name}
                fit="contain"
                fallbackClassName="text-[9px] font-bold text-ink-300"
                fallback={getInitials(player.team.name, 2)}
              />
            </span>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-3 divide-x divide-white/[0.06] border-t border-white/[0.06]">
        <Stat label="PPG" value={ppg} primary />
        <Stat label="RPG" value={rpg} />
        <Stat label="APG" value={apg} />
      </div>
    </Link>
  )
}

function Stat({
  label,
  value,
  primary = false,
}: {
  label: string
  value: string
  primary?: boolean
}) {
  return (
    <div className="px-3 py-2.5 text-center">
      <p
        className={`font-display text-lg font-bold tabular-nums ${
          primary ? "" : "text-ink-200"
        }`}
        style={primary ? { color: "var(--lg-text)" } : undefined}
      >
        {value}
      </p>
      <p className="mt-0.5 font-mono text-[9px] uppercase tracking-widest text-ink-500">
        {label}
      </p>
    </div>
  )
}
