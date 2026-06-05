import Image from "next/image"
import Link from "next/link"
import { getLeagueTheme } from "@/lib/league-styles"
import type { LeagueOverview as LeagueOverviewData } from "@/lib/data/leagues"
import { CountUp } from "@/components/marketing/count-up"

type Props = {
  data: LeagueOverviewData
  index: number
}

function formatPct(value: number | null): string {
  if (value == null) return "—"
  return `${(value * 100).toFixed(1)}%`
}

function formatRecord(wins: number | null, losses: number | null): string {
  if (wins == null || losses == null) return "—"
  return `${wins}-${losses}`
}

function formatNetRtg(value: number | null): string {
  if (value == null) return "—"
  const sign = value > 0 ? "+" : ""
  return `${sign}${value.toFixed(1)}`
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase()
}

export function LeagueOverview({ data, index }: Props) {
  const theme = getLeagueTheme(data.slug)
  const accentBarStyle = { background: theme.glowVar }
  const teamAccent = data.leader?.primaryColor
  const leaderRing = teamAccent
    ? { boxShadow: `0 0 24px -8px ${teamAccent}` }
    : undefined
  const leaderSwatchStyle = teamAccent
    ? { background: teamAccent, boxShadow: `0 0 18px -2px ${teamAccent}` }
    : undefined

  return (
    <article
      className={`group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.04] via-white/[0.02] to-transparent p-5 ring-1 ring-inset ring-white/5 transition hover:border-white/20 hover:ring-1 sm:p-6 ${theme.ring}`}
      style={{ ["--tw-shadow" as string]: theme.glowVar }}
    >
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-0.5"
        style={accentBarStyle}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full opacity-25 blur-3xl"
        style={{ background: theme.glowVar }}
      />

      <header className="relative flex items-start gap-3">
        {data.logoUrl ? (
          <Image
            src={data.logoUrl}
            alt={`${data.name} logo`}
            width={48}
            height={48}
            className="h-12 w-12 shrink-0 rounded-lg border border-white/10 bg-white/95 object-contain p-1.5"
            unoptimized
          />
        ) : (
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-white/10 font-display text-sm font-bold ${theme.chip}`}
          >
            {theme.label}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-300 sm:text-[11px]">
            {data.country}
            {data.seasonLabel ? (
              <>
                <span className="mx-1.5 text-ink-500">·</span>
                <span className={theme.accentText}>
                  {data.seasonLabel}
                </span>{" "}
                season
              </>
            ) : null}
          </p>
          <h2 className="mt-1 font-display text-2xl font-bold leading-tight text-ink-50 sm:text-[1.7rem]">
            {data.name}
          </h2>
        </div>
        <span
          className={`hidden shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest sm:inline-flex ${theme.chip}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          Live
        </span>
      </header>

      <dl className="relative mt-5 grid grid-cols-3 gap-3 sm:gap-4">
        {[
          { value: data.teamCount, label: "Teams" },
          { value: data.playerCount, label: "Players" },
          { value: data.coachCount, label: "Coaches" },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-lg border border-white/5 bg-white/[0.02] px-2.5 py-2 sm:px-3 sm:py-2.5"
          >
            <dt className="font-display text-xl font-bold tabular-nums text-ink-50 sm:text-2xl">
              <CountUp to={s.value} duration={900 + index * 120} />
            </dt>
            <dd className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-ink-400 sm:text-[10px]">
              {s.label}
            </dd>
          </div>
        ))}
      </dl>

      <div
        aria-hidden
        className={`my-5 h-px bg-gradient-to-r from-transparent ${theme.divider} to-transparent`}
      />

      <section className="relative">
        <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-300 sm:text-[11px]">
          <span className={`h-1.5 w-1.5 rounded-full ${theme.accentBg}`} />
          Top 3 scorers
          {data.seasonLabel ? (
            <span className="ml-auto font-mono text-[9px] font-medium normal-case tracking-wider text-ink-500 sm:text-[10px]">
              {data.seasonLabel} · PPG
            </span>
          ) : null}
        </p>
        {data.topScorers.length > 0 ? (
          <ol className="mt-3 space-y-1.5">
            {data.topScorers.map((scorer, i) => (
              <li key={scorer.playerId}>
                <Link
                  href={`/players/${scorer.slug}`}
                  className="group/scorer flex items-center gap-3 rounded-lg border border-transparent px-2 py-1.5 transition hover:border-white/10 hover:bg-white/[0.04]"
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md font-mono text-[10px] font-bold ${theme.numeralBg}`}
                  >
                    {i + 1}
                  </span>
                  {scorer.photoUrl ? (
                    <Image
                      src={scorer.photoUrl}
                      alt={scorer.fullName}
                      width={28}
                      height={28}
                      className="h-7 w-7 shrink-0 rounded-full border border-white/10 bg-white/10 object-cover"
                      unoptimized
                    />
                  ) : (
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/10 font-display text-[10px] font-bold ${theme.chip}`}
                    >
                      {initials(scorer.fullName)}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink-50 group-hover/scorer:text-white">
                      {scorer.fullName}
                    </p>
                    {scorer.team ? (
                      <p className="truncate font-mono text-[10px] uppercase tracking-wider text-ink-400">
                        {scorer.team.name}
                      </p>
                    ) : (
                      <p className="font-mono text-[10px] uppercase tracking-wider text-ink-500">
                        Free agent
                      </p>
                    )}
                  </div>
                  <span
                    className={`shrink-0 font-mono text-sm font-bold tabular-nums ${theme.accentText}`}
                  >
                    {scorer.ppg.toFixed(1)}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-3 rounded-lg border border-dashed border-white/10 bg-white/[0.02] px-3 py-4 text-center text-xs text-ink-400">
            No scorer data yet for this league.
          </p>
        )}
      </section>

      <div
        aria-hidden
        className={`my-5 h-px bg-gradient-to-r from-transparent ${theme.divider} to-transparent`}
      />

      <section className="relative">
        <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-300 sm:text-[11px]">
          <span className={`h-1.5 w-1.5 rounded-full ${theme.accentBg}`} />
          Season leader
        </p>
        {data.leader ? (
          <Link
            href={`/teams/${data.slug}/${data.leader.slug}`}
            className="group/leader mt-3 flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.02] p-3 transition hover:border-white/20 hover:bg-white/[0.05]"
            style={leaderRing}
          >
            <span
              className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md border border-white/10 bg-white/95"
              style={leaderSwatchStyle}
            >
              {data.leader.logoUrl ? (
                <Image
                  src={data.leader.logoUrl}
                  alt={data.leader.name}
                  width={40}
                  height={40}
                  className="h-10 w-10 object-contain p-1"
                  unoptimized
                />
              ) : (
                <span
                  className="font-display text-sm font-bold text-ink-950"
                  style={
                    data.leader.primaryColor ? { color: "#0a0a0a" } : undefined
                  }
                >
                  {initials(data.leader.name)}
                </span>
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink-50 group-hover/leader:text-white">
                {data.leader.name}
              </p>
              <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-ink-400">
                {formatRecord(data.leader.wins, data.leader.losses)} · Win%{" "}
                {formatPct(data.leader.winPct)}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p
                className={`font-mono text-base font-bold tabular-nums ${theme.accentText}`}
              >
                {formatNetRtg(data.leader.netRtg)}
              </p>
              <p className="font-mono text-[9px] uppercase tracking-widest text-ink-500">
                NetRtg
              </p>
            </div>
          </Link>
        ) : (
          <p className="mt-3 rounded-lg border border-dashed border-white/10 bg-white/[0.02] px-3 py-4 text-center text-xs text-ink-400">
            No standings synced yet.
          </p>
        )}
      </section>

      <div className="mt-auto pt-6" />

      <footer className="relative grid grid-cols-2 gap-2">
        <Link
          href={`/players?league=${data.slug}`}
          className={`group/btn inline-flex items-center justify-center gap-1.5 rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-ink-50 transition hover:border-white/30 hover:bg-white/[0.08] sm:text-sm`}
        >
          Browse players
          <svg
            className="h-3.5 w-3.5 transition group-hover/btn:translate-x-0.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M5 12h14M13 5l7 7-7 7" />
          </svg>
        </Link>
        <Link
          href={`/teams?league=${data.slug}`}
          className={`group/btn inline-flex items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-xs font-semibold transition sm:text-sm ${theme.accentBorder} ${theme.accentText} hover:bg-white/[0.06]`}
          style={{
            background: `color-mix(in oklab, var(--shadow-league-${theme.key}) 12%, transparent)`,
          }}
        >
          Browse teams
          <svg
            className="h-3.5 w-3.5 transition group-hover/btn:translate-x-0.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M5 12h14M13 5l7 7-7 7" />
          </svg>
        </Link>
      </footer>
    </article>
  )
}
