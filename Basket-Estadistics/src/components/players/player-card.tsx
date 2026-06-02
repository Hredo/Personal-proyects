import Link from "next/link"

type Props = {
  player: {
    id: string
    fullName: string
    slug: string
    nationality: string | null
    position: string | null
    photoUrl: string | null
    league: { id: string; name: string; slug: string; country: string }
    team: { id: string; name: string; slug: string; logoUrl: string | null } | null
    stats: {
      gamesPlayed: number
      points: number | null
      rebounds: number | null
      assists: number | null
    } | null
  }
  index?: number
}

function formatStat(n: number | null | undefined, digits = 1): string {
  if (n == null) return "—"
  return n.toFixed(digits)
}

export function PlayerCard({ player, index = 0 }: Props) {
  const initials = player.fullName
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  return (
    <Link
      href={`/players/${player.slug}`}
      className="group relative flex items-center gap-4 overflow-hidden rounded-xl border border-white/5 bg-white/[0.02] p-4 transition hover:border-brand-500/40 hover:bg-white/[0.05]"
      style={{ animationDelay: `${Math.min(index, 12) * 30}ms` }}
    >
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-court-800 ring-1 ring-white/5">
        {player.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={player.photoUrl}
            alt={player.fullName}
            className="h-full w-full object-cover transition group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm font-bold text-brand-300">
            {initials}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-ink-50">{player.fullName}</p>
        <p className="mt-0.5 truncate text-xs text-ink-300">
          {player.team?.name ?? "Free agent"} · {player.league.name}
        </p>
      </div>
      <div className="grid grid-cols-3 gap-3 text-right font-mono text-sm">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-ink-400">PPG</p>
          <p className="font-semibold text-brand-300">
            {formatStat(player.stats?.points)}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-ink-400">RPG</p>
          <p className="font-semibold text-ink-100">
            {formatStat(player.stats?.rebounds)}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-ink-400">APG</p>
          <p className="font-semibold text-ink-100">
            {formatStat(player.stats?.assists)}
          </p>
        </div>
      </div>
    </Link>
  )
}
