import Link from "next/link"
import { SmartImage } from "@/components/ui/smart-image"
import {
  ageFrom,
  formatHeight,
  formatPct,
  formatStat,
  formatWeight,
  getInitials,
} from "@/lib/format"

const LEAGUE_ACCENT: Record<string, string> = {
  nba: "bg-brand-500/15 text-brand-200 ring-brand-500/30",
  euroleague: "bg-accent-cyan/10 text-accent-cyan ring-accent-cyan/30",
  acb: "bg-amber-500/10 text-amber-200 ring-amber-500/30",
}

type Props = {
  player: {
    id: string
    fullName: string
    slug: string
    nationality: string | null
    position: string | null
    birthdate: string | null
    heightCm: number | null
    weightKg: number | null
    photoUrl: string | null
    league: { id: string; name: string; slug: string; country: string }
    team: { id: string; name: string; slug: string; logoUrl: string | null } | null
    stats: {
      seasonName: string
      year: number
      gamesPlayed: number
      minutesPerGame: number | null
      points: number | null
      rebounds: number | null
      assists: number | null
      steals: number | null
      blocks: number | null
      turnovers: number | null
      fgPct: number | null
      threePct: number | null
      ftPct: number | null
      offRtg: number | null
      defRtg: number | null
      per: number | null
    } | null
  }
  index?: number
}

export function PlayerCard({ player, index = 0 }: Props) {
  const initials = getInitials(player.fullName)
  const age = ageFrom(player.birthdate)
  const s = player.stats

  return (
    <Link
      href={`/players/${player.slug}`}
      className="group relative block overflow-hidden rounded-xl border border-white/5 bg-white/[0.02] p-3 transition hover:border-brand-500/40 hover:bg-white/[0.05] sm:p-4"
      style={{ animationDelay: `${Math.min(index, 12) * 25}ms` }}
    >
      <div className="flex items-start gap-3">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-court-800 ring-1 ring-white/5 sm:h-20 sm:w-20">
          <SmartImage
            src={player.photoUrl}
            alt={player.fullName}
            fit="cover"
            className="transition duration-300 group-hover:scale-105"
            fallbackClassName="bg-gradient-to-br from-court-800 to-ink-900 text-sm font-bold text-brand-300 sm:text-base"
            fallback={initials}
          />
          {player.team?.logoUrl ? (
            <span className="absolute -bottom-1 -right-1 h-6 w-6 overflow-hidden rounded-full bg-ink-950 ring-2 ring-ink-950">
              <SmartImage
                src={player.team.logoUrl}
                alt={player.team.name}
                fit="cover"
                fallbackClassName="text-[8px] font-bold text-brand-300"
                fallback={getInitials(player.team.name)}
              />
            </span>
          ) : null}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <p className="truncate text-sm font-semibold text-ink-50 group-hover:text-brand-200 sm:text-base">
              {player.fullName}
            </p>
            <span
              className={`hidden rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ring-1 sm:inline-flex ${
                LEAGUE_ACCENT[player.league.slug] ??
                "bg-white/5 text-ink-200 ring-white/10"
              }`}
            >
              {player.league.name}
            </span>
          </div>

          <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[11px] text-ink-300 sm:text-xs">
            {player.position ? (
              <span className="font-semibold text-ink-100">
                {player.position}
              </span>
            ) : null}
            {player.nationality ? <span>· {player.nationality}</span> : null}
            {age != null ? <span>· {age} y.o.</span> : null}
            <span className="hidden sm:inline">
              · {formatHeight(player.heightCm)} · {formatWeight(player.weightKg)}
            </span>
          </p>

          <p className="mt-0.5 truncate text-[11px] text-ink-400 sm:text-xs">
            {player.team?.name ?? "Free agent"}
          </p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-4 gap-2 font-mono sm:mt-3.5 sm:grid-cols-7 sm:gap-2.5">
        <Stat label="PPG" value={formatStat(s?.points)} highlight />
        <Stat label="RPG" value={formatStat(s?.rebounds)} />
        <Stat label="APG" value={formatStat(s?.assists)} />
        <Stat label="SPG" value={formatStat(s?.steals, 1)} />
        <Stat label="BPG" value={formatStat(s?.blocks, 1)} />
        <Stat label="FG%" value={formatPct(s?.fgPct, 1)} />
        <Stat label="3P%" value={formatPct(s?.threePct, 1)} />
      </div>

      <div className="mt-2 hidden grid-cols-6 gap-2 border-t border-white/5 pt-2 font-mono sm:grid">
        <Stat label="FT%" value={formatPct(s?.ftPct, 1)} muted />
        <Stat label="MPG" value={formatStat(s?.minutesPerGame)} muted />
        <Stat label="TO" value={formatStat(s?.turnovers, 1)} muted />
        <Stat label="OffRtg" value={formatStat(s?.offRtg, 0)} muted />
        <Stat label="DefRtg" value={formatStat(s?.defRtg, 0)} muted />
        <Stat label="PER" value={formatStat(s?.per, 1)} muted />
      </div>

      <div className="mt-2 flex items-center justify-between text-[10px] uppercase tracking-widest text-ink-500">
        <span>
          {s ? (
            <>
              Season {s.year} · {s.gamesPlayed} GP
            </>
          ) : (
            "No stats"
          )}
        </span>
        <span className="text-ink-400 transition group-hover:text-brand-300">
          Open →
        </span>
      </div>
    </Link>
  )
}

function Stat({
  label,
  value,
  highlight = false,
  muted = false,
}: {
  label: string
  value: string
  highlight?: boolean
  muted?: boolean
}) {
  return (
    <div className="min-w-0">
      <p className="truncate text-[9px] uppercase tracking-wider text-ink-500 sm:text-[10px]">
        {label}
      </p>
      <p
        className={`truncate text-[11px] font-semibold sm:text-xs ${
          highlight
            ? "text-brand-300"
            : muted
              ? "text-ink-200"
              : "text-ink-100"
        }`}
      >
        {value}
      </p>
    </div>
  )
}
