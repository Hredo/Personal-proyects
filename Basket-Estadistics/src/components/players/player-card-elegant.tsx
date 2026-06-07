"use client"

import Link from "next/link"
import { SmartImage } from "@/components/ui/smart-image"
import { getInitials } from "@/lib/format"

const LEAGUE_BADGE: Record<string, string> = {
  nba: "bg-brand-500/15 text-brand-200 ring-brand-500/30",
  euroleague: "bg-accent-cyan/10 text-accent-cyan ring-accent-cyan/30",
  acb: "bg-amber-500/10 text-amber-200 ring-amber-500/30",
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
}

export function PlayerCardElegant({ player }: Props) {
  const initials = getInitials(player.fullName)
  const s = player.stats
  const ppg = s?.points != null ? s.points.toFixed(1) : "—"
  const rpg = s?.rebounds != null ? s.rebounds.toFixed(1) : "—"
  const apg = s?.assists != null ? s.assists.toFixed(1) : "—"
  const badge = LEAGUE_BADGE[player.league.slug] ?? LEAGUE_BADGE.nba

  return (
    <Link
      href={`/players/${player.slug}`}
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl bg-white/[0.02] ring-1 ring-transparent transition duration-150 hover:ring-brand-500/50"
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-court-900">
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/30 to-transparent"
        />
        <SmartImage
          src={player.photoUrl}
          alt={player.fullName}
          fit="cover"
          className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
          fallbackClassName="bg-gradient-to-br from-court-800 via-court-900 to-ink-900 text-3xl font-bold text-brand-300"
          fallback={initials}
        />
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-4">
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-display text-base font-semibold text-ink-50 sm:text-lg">
              {player.fullName}
            </h3>
            <p className="mt-0.5 truncate text-xs text-ink-300">
              {player.team?.name ?? "Free agent"}
            </p>
          </div>
          {player.team?.logoUrl ? (
            <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md bg-ink-950/70 p-1 ring-1 ring-white/10 backdrop-blur">
              <SmartImage
                src={player.team.logoUrl}
                alt={player.team.name}
                fit="contain"
                fallbackClassName="text-[9px] font-bold text-brand-300"
                fallback={getInitials(player.team.name, 2)}
              />
            </span>
          ) : null}
        </div>
        <span
          className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ring-1 backdrop-blur ${badge}`}
        >
          {player.league.name}
        </span>
      </div>

      <div className="flex items-center gap-4 px-4 py-3 text-sm">
        <Stat label="PPG" value={ppg} primary />
        <span className="h-6 w-px bg-white/10" />
        <Stat label="RPG" value={rpg} />
        <span className="h-6 w-px bg-white/10" />
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
    <div className="min-w-0">
      <p className="font-mono text-[9px] uppercase tracking-widest text-ink-500">
        {label}
      </p>
      <p
        className={`font-mono text-sm font-semibold ${
          primary ? "text-brand-300" : "text-ink-100"
        }`}
      >
        {value}
      </p>
    </div>
  )
}
