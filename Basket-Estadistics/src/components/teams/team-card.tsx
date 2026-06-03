import Link from "next/link"
import { SmartImage } from "@/components/ui/smart-image"
import { formatPct, formatStat, getInitials } from "@/lib/format"

const LEAGUE_ACCENT: Record<string, string> = {
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
    city: string | null
    shortName: string | null
    foundedYear: number | null
    arena: string | null
    primaryColor: string | null
    league: { id: string; name: string; slug: string; country: string }
    playerCount: number
    seasonStats: {
      year: number
      gamesPlayed: number
      wins: number | null
      losses: number | null
      winPct: number | null
      pointsFor: number | null
      pointsAgainst: number | null
      position: number | null
      pace: number | null
      offRtg: number | null
      defRtg: number | null
      netRtg: number | null
    } | null
  }
  index?: number
}

export function TeamCard({ team, index = 0 }: Props) {
  const initials = getInitials(team.name, 3)
  const s = team.seasonStats
  const wins = s?.wins ?? 0
  const losses = s?.losses ?? 0
  const winPct = s
    ? wins + losses > 0
      ? wins / (wins + losses)
      : s.winPct
    : null
  const diff = s && s.pointsFor != null && s.pointsAgainst != null
    ? s.pointsFor - s.pointsAgainst
    : null

  return (
    <Link
      href={`/teams/${team.league.slug}/${team.slug}`}
      className="group relative block overflow-hidden rounded-xl border border-white/5 bg-white/[0.02] p-3 transition hover:border-brand-500/40 hover:bg-white/[0.05] sm:p-4"
      style={{ animationDelay: `${Math.min(index, 12) * 25}ms` }}
    >
      <div className="flex items-start gap-3">
        <div
          className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-court-800 ring-1 ring-white/5 sm:h-20 sm:w-20"
          style={
            team.primaryColor
              ? { boxShadow: `inset 0 0 0 1px ${team.primaryColor}40` }
              : undefined
          }
        >
          <SmartImage
            src={team.logoUrl}
            alt={team.name}
            fit="contain"
            className="p-2 transition duration-300 group-hover:scale-105"
            fallbackClassName="text-base font-bold text-brand-300 sm:text-lg"
            fallback={initials}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <p className="truncate text-sm font-semibold text-ink-50 group-hover:text-brand-200 sm:text-base">
              {team.name}
            </p>
            <span
              className={`hidden rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ring-1 sm:inline-flex ${
                LEAGUE_ACCENT[team.league.slug] ??
                "bg-white/5 text-ink-200 ring-white/10"
              }`}
            >
              {team.league.name}
            </span>
          </div>

          <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[11px] text-ink-300 sm:text-xs">
            {team.city ? <span>{team.city}</span> : null}
            {team.country ? <span>· {team.country}</span> : null}
            {team.foundedYear ? <span>· Est. {team.foundedYear}</span> : null}
            {team.arena ? (
              <span className="hidden sm:inline">· {team.arena}</span>
            ) : null}
          </p>

          <p className="mt-0.5 truncate text-[11px] text-ink-400 sm:text-xs">
            {team.playerCount} player{team.playerCount === 1 ? "" : "s"} on
            roster
          </p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-4 gap-2 font-mono sm:mt-3.5 sm:grid-cols-4 sm:gap-2.5">
        <Stat
          label="W-L"
          value={s ? `${s.wins ?? 0}-${s.losses ?? 0}` : "—"}
          highlight
        />
        <Stat label="Win%" value={formatPct(winPct, 1)} />
        <Stat label="Pos" value={s?.position != null ? `#${s.position}` : "—"} />
        <Stat label="GP" value={s ? String(s.gamesPlayed) : "—"} />
      </div>

      <div className="mt-2 hidden grid-cols-6 gap-2 border-t border-white/5 pt-2 font-mono sm:grid">
        <Stat
          label="OffRtg"
          value={formatStat(s?.offRtg, 0)}
          muted
          tone={s && s.offRtg != null && s.offRtg > 110 ? "good" : undefined}
        />
        <Stat
          label="DefRtg"
          value={formatStat(s?.defRtg, 0)}
          muted
          tone={s && s.defRtg != null && s.defRtg < 110 ? "good" : undefined}
        />
        <Stat
          label="NetRtg"
          value={
            s?.netRtg != null
              ? `${s.netRtg > 0 ? "+" : ""}${s.netRtg.toFixed(1)}`
              : "—"
          }
          muted
          tone={
            s?.netRtg != null
              ? s.netRtg > 0
                ? "good"
                : s.netRtg < 0
                  ? "bad"
                  : undefined
              : undefined
          }
        />
        <Stat label="Pace" value={formatStat(s?.pace, 1)} muted />
        <Stat label="PF/G" value={formatStat(s?.pointsFor, 1)} muted />
        <Stat label="PA/G" value={formatStat(s?.pointsAgainst, 1)} muted />
      </div>

      <div className="mt-2 flex items-center justify-between text-[10px] uppercase tracking-widest text-ink-500">
        <span>
          {s ? (
            <>
              Season {s.year} ·{" "}
              {diff != null
                ? `${diff > 0 ? "+" : ""}${diff.toFixed(1)} diff`
                : "no data"}
            </>
          ) : (
            "No season stats"
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
  tone,
}: {
  label: string
  value: string
  highlight?: boolean
  muted?: boolean
  tone?: "good" | "bad"
}) {
  const valueClass = highlight
    ? "text-brand-300"
    : tone === "good"
      ? "text-emerald-300"
      : tone === "bad"
        ? "text-rose-300"
        : muted
          ? "text-ink-200"
          : "text-ink-100"
  return (
    <div className="min-w-0">
      <p className="truncate text-[9px] uppercase tracking-wider text-ink-500 sm:text-[10px]">
        {label}
      </p>
      <p className={`truncate text-[11px] font-semibold sm:text-xs ${valueClass}`}>
        {value}
      </p>
    </div>
  )
}
