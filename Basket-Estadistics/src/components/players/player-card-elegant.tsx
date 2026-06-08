"use client"

import Link from "next/link"
import { SmartImage } from "@/components/ui/smart-image"
import { leagueAccent } from "@/components/ui/league-badge"
import { getInitials } from "@/lib/format"

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
  const accent = leagueAccent(player.league.slug)

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
        className="absolute inset-x-0 top-0 z-10 h-[3px] opacity-60 transition-opacity duration-500 group-hover:opacity-100"
        style={{ background: "var(--lg)" }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -right-12 -top-12 z-0 h-32 w-32 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-40"
        style={{ background: "var(--lg)" }}
      />

      <div className="relative aspect-[4/5] w-full overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 z-[1] bg-gradient-to-t from-surface-1 via-surface-1/30 to-transparent"
        />
        <SmartImage
          src={player.photoUrl}
          alt={player.fullName}
          fit="cover"
          className="h-full w-full object-cover transition-transform duration-[700ms] ease-fluid group-hover:scale-[1.06]"
          fallbackClassName="bg-gradient-to-br from-court-800 via-court-900 to-ink-900 text-4xl font-bold text-ink-600"
          fallback={initials}
        />

        {rank != null ? (
          <span className="absolute left-3 top-3 z-[2] flex h-7 min-w-7 items-center justify-center rounded-lg bg-ink-950/70 px-1.5 font-mono text-xs font-bold tabular-nums text-ink-100 ring-1 ring-hairline backdrop-blur">
            {rank}
          </span>
        ) : null}

        <span className="absolute right-3 top-3 z-[2] inline-flex items-center gap-1.5 rounded-full bg-ink-950/55 px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-100 ring-1 ring-hairline backdrop-blur">
          <span
            aria-hidden
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: "var(--lg)" }}
          />
          {player.league.name}
        </span>

        <div className="absolute inset-x-0 bottom-0 z-[2] flex items-end justify-between gap-2 p-4">
          <div className="min-w-0 flex-1">
            {player.position ? (
              <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-400">
                {player.position}
              </p>
            ) : null}
            <h3 className="truncate font-display text-lg font-bold leading-tight tracking-[-0.01em] text-ink-50">
              {player.fullName}
            </h3>
            <p className="mt-0.5 truncate text-xs text-ink-300">
              {player.team?.name ?? "Free agent"}
            </p>
          </div>
          {player.team?.logoUrl ? (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-ink-950/70 p-1 ring-1 ring-hairline backdrop-blur">
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

      <div className="grid grid-cols-3 divide-x divide-hairline hairline-t">
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
      <p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-ink-500">
        {label}
      </p>
    </div>
  )
}
