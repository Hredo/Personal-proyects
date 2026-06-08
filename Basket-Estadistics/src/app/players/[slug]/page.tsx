import { Suspense } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { and, eq, sql } from "drizzle-orm"
import { getDb } from "@/lib/db/client"
import { players, playerStats, seasons } from "@/lib/db/schema"
import { getPlayerBySlug } from "@/lib/data/players"
import { FadeIn } from "@/components/animations/fade-in"
import { StatBar } from "@/components/players/stat-bar"
import { SmartImage } from "@/components/ui/smart-image"
import { Eyebrow } from "@/components/ui/eyebrow"
import { leagueAccent } from "@/components/ui/league-badge"
import { JsonLd } from "@/components/marketing/json-ld"
import { breadcrumbJsonLd, playerJsonLd } from "@/lib/seo/structured-data"
import { SITE } from "@/lib/site"
import { HighlightsSection } from "./highlights"

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const profile = await getPlayerBySlug(slug)
  if (!profile) return { title: "Player not found" }
  const description = `${profile.fullName} — ${
    profile.position ?? "Player"
  } at ${profile.team?.name ?? "free agent"} in ${profile.league.name}. ${
    profile.seasons[0]?.points
      ? `Averaging ${profile.seasons[0].points.toFixed(1)} PPG.`
      : ""
  }`
  return {
    title: profile.fullName,
    description,
    alternates: { canonical: `${SITE.url}/players/${slug}` },
  }
}

function formatHeight(cm: number | null): string {
  if (cm == null) return "—"
  const totalIn = cm / 2.54
  const ft = Math.floor(totalIn / 12)
  const inches = Math.round(totalIn - ft * 12)
  return `${ft}'${inches}" (${cm} cm)`
}

function formatWeight(kg: number | null): string {
  if (kg == null) return "—"
  return `${kg} kg (${Math.round(kg * 2.20462)} lb)`
}

function formatBirth(bd: string | null): string {
  if (!bd) return "—"
  const d = new Date(bd)
  if (Number.isNaN(d.getTime())) return bd
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

function ageFrom(bd: string | null): number | null {
  if (!bd) return null
  const d = new Date(bd)
  if (Number.isNaN(d.getTime())) return null
  const ms = Date.now() - d.getTime()
  return Math.floor(ms / (365.25 * 24 * 3600 * 1000))
}

async function findComparisonCandidates(
  leagueId: string,
  excludePlayerId: string,
): Promise<
  Array<{ id: string; slug: string; fullName: string; points: number | null }>
> {
  const db = getDb()
  const rows = await db
    .select({
      id: players.id,
      slug: players.slug,
      fullName: players.fullName,
      points: sql<number | null>`max(${playerStats.points})`,
    })
    .from(players)
    .leftJoin(playerStats, eq(playerStats.playerId, players.id))
    .leftJoin(seasons, eq(playerStats.seasonId, seasons.id))
    .where(
      and(
        eq(seasons.leagueId, leagueId),
        sql`${players.id} <> ${excludePlayerId}`,
      ),
    )
    .groupBy(players.id)
    .orderBy(sql`max(coalesce(${playerStats.points}, 0)) desc`)
    .limit(6)
  return rows as Array<{
    id: string
    slug: string
    fullName: string
    points: number | null
  }>
}

export default async function PlayerPage({ params }: Props) {
  const { slug } = await params
  const profile = await getPlayerBySlug(slug)
  if (!profile) notFound()

  const candidates = await findComparisonCandidates(
    profile.league.id,
    profile.id,
  )
  const initials = profile.fullName
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")

  const season = profile.seasons[0]
  const accent = leagueAccent(profile.league.slug)

  const structuredData = [
    playerJsonLd({
      fullName: profile.fullName,
      slug: profile.slug,
      position: profile.position,
      nationality: profile.nationality,
      birthdate: profile.birthdate,
      heightCm: profile.heightCm,
      weightKg: profile.weightKg,
      photoUrl: profile.photoUrl,
      teamName: profile.team?.name ?? null,
      leagueName: profile.league.name,
    }),
    breadcrumbJsonLd([
      { name: "Players", path: "/players" },
      { name: profile.fullName, path: `/players/${profile.slug}` },
    ]),
  ]

  return (
    <div
      className="relative pb-6 pt-6 sm:pb-10 sm:pt-10"
      style={{ ["--lg" as string]: accent.color }}
    >
      <JsonLd data={structuredData} />
      <div
        aria-hidden
        className="absolute -top-16 left-0 -z-10 h-72 w-[560px] rounded-full opacity-20 blur-3xl"
        style={{ background: "var(--lg)" }}
      />
      <div aria-hidden className="absolute inset-x-0 -top-6 -z-10 h-60 bg-dot-field opacity-40" />
      <FadeIn>
        <Link
          href="/players"
          className="mb-5 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-300 transition hover:text-brand-300 sm:mb-6"
        >
          <span aria-hidden>←</span> Back to players
        </Link>
      </FadeIn>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr] lg:gap-8">
        <FadeIn>
          <aside className="space-y-4">
            <div className="relative mx-auto aspect-square w-44 overflow-hidden rounded-2xl bg-court-800 ring-1 ring-hairline sm:w-56 lg:w-full">
              <span
                aria-hidden
                className="absolute inset-x-0 top-0 z-10 h-[3px]"
                style={{ background: "var(--lg)" }}
              />
              <SmartImage
                src={profile.photoUrl}
                alt={profile.fullName}
                fit="cover"
                eager
                fallbackClassName="text-4xl font-bold text-ink-300 sm:text-5xl"
                fallback={initials}
              />
            </div>
            <div className="gh-card p-4 text-sm">
              <h3 className="gh-eyebrow">Bio</h3>
              <dl className="mt-3 space-y-2">
                <Row k="Position" v={profile.position ?? "—"} />
                <Row k="Nationality" v={profile.nationality ?? "—"} />
                <Row
                  k="Born"
                  v={`${formatBirth(profile.birthdate)}${
                    ageFrom(profile.birthdate)
                      ? ` (${ageFrom(profile.birthdate)} y.o.)`
                      : ""
                  }`}
                />
                <Row k="Height" v={formatHeight(profile.heightCm)} />
                <Row k="Weight" v={formatWeight(profile.weightKg)} />
                <Row
                  k="League"
                  v={
                    <span className="font-semibold text-ink-100">
                      {profile.league.name}
                    </span>
                  }
                />
                <Row
                  k="Team"
                  v={
                    profile.team ? (
                      <span className="font-semibold text-ink-100">
                        {profile.team.name}
                      </span>
                    ) : (
                      "Free agent"
                    )
                  }
                />
              </dl>
            </div>
          </aside>
        </FadeIn>

        <div className="space-y-6 sm:space-y-8">
          <FadeIn>
            <header>
              <Eyebrow>
                <span
                  aria-hidden
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: "var(--lg)" }}
                />
                {profile.league.name} · {profile.team?.name ?? "Free agent"}
              </Eyebrow>
              <h1 className="mt-3 font-display text-4xl font-bold leading-[0.9] tracking-[-0.04em] text-ink-50 sm:text-5xl md:text-6xl">
                {profile.fullName}
              </h1>
              {season ? (
                <p className="mt-3 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-400">
                  <span className="h-1.5 w-1.5 animate-ticker rounded-full bg-positive" />
                  Season {season.year} · {season.gamesPlayed} games
                </p>
              ) : null}
            </header>
          </FadeIn>

          {season ? (
            <FadeIn>
              <section>
                <h2 className="gh-eyebrow mb-4">
                  Production
                </h2>
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3">
                  <StatTile
                    label="Points"
                    value={season.points}
                    unit="PPG"
                    highlight
                  />
                  <StatTile
                    label="Rebounds"
                    value={season.rebounds}
                    unit="RPG"
                  />
                  <StatTile label="Assists" value={season.assists} unit="APG" />
                  <StatTile label="Steals" value={season.steals} unit="SPG" />
                  <StatTile label="Blocks" value={season.blocks} unit="BPG" />
                  <StatTile
                    label="Turnovers"
                    value={season.turnovers}
                    unit="TOPG"
                  />
                </div>
              </section>
            </FadeIn>
          ) : (
            <div className="rounded-xl border border-dashed border-white/10 p-6 text-center text-sm text-ink-300">
              No season stats on record for this player yet.
            </div>
          )}

          {season ? (
            <FadeIn>
              <section>
                <h2 className="gh-eyebrow mb-4">
                  Efficiency
                </h2>
                <div className="gh-card space-y-3 p-4 sm:p-5">
                  <StatBar
                    label="FG%"
                    value={season.fgPct}
                    max={1}
                    format={(n) => `${(n * 100).toFixed(1)}%`}
                    hint="league ~46%"
                  />
                  <StatBar
                    label="3P%"
                    value={season.threePct}
                    max={1}
                    format={(n) => `${(n * 100).toFixed(1)}%`}
                    hint="league ~35%"
                  />
                  <StatBar
                    label="FT%"
                    value={season.ftPct}
                    max={1}
                    format={(n) => `${(n * 100).toFixed(1)}%`}
                    hint="league ~78%"
                  />
                </div>
              </section>
            </FadeIn>
          ) : null}

          {candidates.length > 0 ? (
            <FadeIn>
              <section>
                <h2 className="gh-eyebrow mb-4">
                  Compare with
                </h2>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3">
                  {candidates.map((c) => (
                    <Link
                      key={c.id}
                      href={`/compare?a=${profile.slug}&b=${c.slug}`}
                      className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2.5 text-sm transition hover:border-brand-500/40 hover:bg-white/[0.05] sm:px-4 sm:py-3"
                    >
                      <span className="truncate font-semibold text-ink-100">
                        {c.fullName}
                      </span>
                      <span className="shrink-0 font-mono text-xs text-brand-300">
                        {c.points != null ? `${c.points.toFixed(1)} PPG` : "—"}
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            </FadeIn>
          ) : null}

          <FadeIn>
            <section>
              <h2 className="gh-eyebrow mb-4">
                Highlights
              </h2>
              <Suspense fallback={<HighlightsSkeleton />}>
                <HighlightsSection
                  playerId={profile.id}
                  playerName={profile.fullName}
                  teamName={profile.team?.name ?? null}
                  leagueName={profile.league.name}
                />
              </Suspense>
            </section>
          </FadeIn>
        </div>
      </div>
    </div>
  )
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-ink-400">{k}</dt>
      <dd className="text-right text-ink-100">{v}</dd>
    </div>
  )
}

function StatTile({
  label,
  value,
  unit,
  highlight = false,
}: {
  label: string
  value: number | null | undefined
  unit: string
  highlight?: boolean
}) {
  return (
    <div
      className="gh-card gh-card-interactive relative overflow-hidden p-4"
      style={
        highlight
          ? { borderColor: "color-mix(in oklch, var(--lg) 40%, transparent)" }
          : undefined
      }
    >
      {highlight ? (
        <span
          aria-hidden
          className="absolute inset-x-0 top-0 h-[2px]"
          style={{ background: "var(--lg)" }}
        />
      ) : null}
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-400">
        {label}
      </p>
      <p
        className="mt-1 font-display text-3xl font-bold tabular-nums"
        style={highlight ? { color: "var(--lg)" } : { color: "var(--color-ink-50)" }}
      >
        {value != null ? value.toFixed(1) : "—"}
      </p>
      <p className="font-mono text-xs text-ink-400">{unit}</p>
    </div>
  )
}

function HighlightsSkeleton() {
  return (
    <div className="aspect-video w-full animate-pulse rounded-xl border border-white/5 bg-white/[0.02]" />
  )
}
