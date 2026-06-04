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
  team: {
    id: string
    name: string
    slug: string
    logoUrl: string | null
    country: string | null
    primaryColor: string | null
    league: { id: string; name: string; slug: string; country: string }
    playerCount: number
    seasonStats: {
      year: number
      wins: number | null
      losses: number | null
      netRtg: number | null
    } | null
  }
}

export function TeamCardElegant({ team }: Props) {
  const initials = getInitials(team.name, 3)
  const s = team.seasonStats
  const wins = s?.wins ?? 0
  const losses = s?.losses ?? 0
  const netRtg =
    s?.netRtg != null
      ? `${s.netRtg > 0 ? "+" : ""}${s.netRtg.toFixed(1)}`
      : "—"
  const badge = LEAGUE_BADGE[team.league.slug] ?? LEAGUE_BADGE.nba
  const accent = team.primaryColor ?? "var(--color-brand-500)"

  return (
    <Link
      href={`/teams/${team.league.slug}/${team.slug}`}
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl bg-white/[0.02] ring-1 ring-transparent transition duration-150 hover:ring-brand-500/50"
      style={{
        ["--team-accent" as string]: accent,
      }}
    >
      <div
        className="relative aspect-[5/3] w-full overflow-hidden"
        style={{
          backgroundImage: `radial-gradient(ellipse at center, ${accent}1f 0%, transparent 65%)`,
        }}
      >
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,_oklch(0.1_0.03_48/0.6),_transparent_60%)]"
        />
        {team.logoUrl ? (
          <SmartImage
            src={team.logoUrl}
            alt={team.name}
            fit="contain"
            className="relative h-full w-full p-8 transition-transform duration-500 ease-out group-hover:scale-[1.04]"
            fallbackClassName="text-3xl font-bold text-brand-300"
            fallback={initials}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-brand-300">
            {initials}
          </div>
        )}
        <span
          className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ring-1 backdrop-blur ${badge}`}
        >
          {team.league.name}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="truncate font-display text-base font-semibold text-ink-50 sm:text-lg">
            {team.name}
          </h3>
          {team.country ? (
            <p className="mt-0.5 truncate text-xs text-ink-400">
              {team.country}
            </p>
          ) : null}
        </div>

        <div className="mt-auto flex items-end gap-4">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-widest text-ink-500">
              Record
            </p>
            <p className="font-mono text-lg font-semibold text-ink-50">
              {s ? `${wins}-${losses}` : "—"}
            </p>
          </div>
          <div>
            <p className="font-mono text-[9px] uppercase tracking-widest text-ink-500">
              Net
            </p>
            <p
              className={`font-mono text-lg font-semibold ${
                s?.netRtg == null
                  ? "text-ink-200"
                  : s.netRtg > 0
                    ? "text-emerald-300"
                    : s.netRtg < 0
                      ? "text-rose-300"
                      : "text-ink-100"
              }`}
            >
              {netRtg}
            </p>
          </div>
          <div className="ml-auto text-right">
            <p className="font-mono text-[9px] uppercase tracking-widest text-ink-500">
              Roster
            </p>
            <p className="font-mono text-sm font-semibold text-ink-200">
              {team.playerCount}
            </p>
          </div>
        </div>
      </div>
    </Link>
  )
}
