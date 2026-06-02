import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { and, eq, sql } from "drizzle-orm"
import { getDb } from "@/lib/db/client"
import { players, playerStats, seasons } from "@/lib/db/schema"
import { getPlayerBySlug } from "@/lib/data/players"
import { FadeIn } from "@/components/animations/fade-in"
import { StatBar } from "@/components/players/stat-bar"

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

  return (
    <div className="py-10">
      <FadeIn>
        <Link
          href="/players"
          className="mb-6 inline-flex items-center gap-2 text-sm text-ink-300 transition hover:text-brand-300"
        >
          ← Back to players
        </Link>
      </FadeIn>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[260px_1fr]">
        <FadeIn>
          <aside className="space-y-4">
            <div className="aspect-square w-full overflow-hidden rounded-2xl border border-white/5 bg-court-800 ring-1 ring-white/5">
              {profile.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.photoUrl}
                  alt={profile.fullName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-5xl font-bold text-brand-300">
                  {initials}
                </div>
              )}
            </div>
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 text-sm">
              <h3 className="font-display text-xs uppercase tracking-widest text-ink-300">
                Bio
              </h3>
              <dl className="mt-3 space-y-2">
                <Row k="Position" v={profile.position ?? "—"} />
                <Row
                  k="Nationality"
                  v={profile.nationality ?? "—"}
                />
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

        <div className="space-y-8">
          <FadeIn>
            <header>
              <p className="text-sm uppercase tracking-widest text-brand-300">
                {profile.league.name} · {profile.team?.name ?? "—"}
              </p>
              <h1 className="mt-2 font-display text-4xl font-bold text-ink-50 sm:text-5xl">
                {profile.fullName}
              </h1>
              {season ? (
                <p className="mt-2 text-ink-300">
                  Season {season.year} · {season.gamesPlayed} games
                </p>
              ) : null}
            </header>
          </FadeIn>

          {season ? (
            <FadeIn>
              <section>
                <h2 className="mb-3 font-display text-xs uppercase tracking-widest text-ink-300">
                  Production
                </h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <StatTile
                    label="Points"
                    value={season.points}
                    unit="PPG"
                    highlight
                  />
                  <StatTile label="Rebounds" value={season.rebounds} unit="RPG" />
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
            <div className="rounded-xl border border-dashed border-white/10 p-6 text-center text-ink-300">
              No season stats on record for this player yet.
            </div>
          )}

          {season ? (
            <FadeIn>
              <section>
                <h2 className="mb-3 font-display text-xs uppercase tracking-widest text-ink-300">
                  Efficiency
                </h2>
                <div className="space-y-3 rounded-xl border border-white/5 bg-white/[0.02] p-5">
                  <StatBar
                    label="FG%"
                    value={season.fgPct}
                    max={0.7}
                    format={(n) => `${(n * 100).toFixed(1)}%`}
                  />
                  <StatBar
                    label="3P%"
                    value={season.threePct}
                    max={0.5}
                    format={(n) => `${(n * 100).toFixed(1)}%`}
                  />
                  <StatBar
                    label="FT%"
                    value={season.ftPct}
                    max={0.95}
                    format={(n) => `${(n * 100).toFixed(1)}%`}
                  />
                </div>
              </section>
            </FadeIn>
          ) : null}

          {candidates.length > 0 ? (
            <FadeIn>
              <section>
                <h2 className="mb-3 font-display text-xs uppercase tracking-widest text-ink-300">
                  Compare with
                </h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {candidates.map((c) => (
                    <Link
                      key={c.id}
                      href={`/compare?a=${profile.slug}&b=${c.slug}`}
                      className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3 text-sm transition hover:border-brand-500/40 hover:bg-white/[0.05]"
                    >
                      <span className="truncate font-semibold text-ink-100">
                        {c.fullName}
                      </span>
                      <span className="font-mono text-xs text-brand-300">
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
              <h2 className="mb-3 font-display text-xs uppercase tracking-widest text-ink-300">
                Highlights
              </h2>
              <VideoPlaceholder name={profile.fullName} />
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
      className={`rounded-xl border p-4 ${
        highlight
          ? "border-brand-500/30 bg-brand-500/5"
          : "border-white/5 bg-white/[0.02]"
      }`}
    >
      <p className="text-[10px] uppercase tracking-widest text-ink-400">
        {label}
      </p>
      <p
        className={`mt-1 font-display text-3xl font-bold ${
          highlight ? "text-brand-300" : "text-ink-50"
        }`}
      >
        {value != null ? value.toFixed(1) : "—"}
      </p>
      <p className="font-mono text-xs text-ink-400">{unit}</p>
    </div>
  )
}

function VideoPlaceholder({ name }: { name: string }) {
  return (
    <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-6">
      <p className="text-sm text-ink-200">
        Personalised highlight reels for <strong>{name}</strong> will appear here
        once YouTube integration is enabled.
      </p>
      <p className="mt-2 text-xs text-ink-400">
        Set the <code>YOUTUBE_API_KEY</code> environment variable and trigger
        <code className="ml-1">pnpm sync:videos</code> to populate.
      </p>
    </div>
  )
}
