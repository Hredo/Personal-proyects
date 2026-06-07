import Link from "next/link"
import type { Metadata } from "next"
import { getPlayerForCompare } from "@/lib/data/compare"
import { CompareSearch } from "@/components/players/compare-search"
import { CompareBar } from "@/components/players/compare-bar"
import { CompareRadar } from "@/components/players/compare-radar"
import { CompareShootingSplits } from "@/components/players/compare-shooting-splits"
import { CompareAi } from "@/components/players/compare-ai"
import { FadeIn } from "@/components/animations/fade-in"
import { SmartImage } from "@/components/ui/smart-image"

export const metadata: Metadata = {
  title: "Compare",
  description:
    "Put any two players side by side — points, rebounds, assists, shooting splits and more.",
}

type Search = { a?: string; b?: string }

const STAT_KEYS = [
  {
    key: "points",
    label: "Points / G",
    fmt: (n: number) => n.toFixed(1),
    max: 35,
  },
  {
    key: "rebounds",
    label: "Rebounds / G",
    fmt: (n: number) => n.toFixed(1),
    max: 15,
  },
  {
    key: "assists",
    label: "Assists / G",
    fmt: (n: number) => n.toFixed(1),
    max: 12,
  },
  {
    key: "steals",
    label: "Steals / G",
    fmt: (n: number) => n.toFixed(1),
    max: 3,
  },
  {
    key: "blocks",
    label: "Blocks / G",
    fmt: (n: number) => n.toFixed(1),
    max: 3,
  },
  {
    key: "turnovers",
    label: "Turnovers / G",
    fmt: (n: number) => n.toFixed(1),
    max: 5,
    lowerBetter: true,
  },
  {
    key: "fgPct",
    label: "FG%",
    fmt: (n: number) => `${(n * 100).toFixed(1)}%`,
    max: 1,
  },
  {
    key: "threePct",
    label: "3P%",
    fmt: (n: number) => `${(n * 100).toFixed(1)}%`,
    max: 1,
  },
  {
    key: "ftPct",
    label: "FT%",
    fmt: (n: number) => `${(n * 100).toFixed(1)}%`,
    max: 1,
  },
] as const

export default async function ComparePage(props: {
  searchParams: Promise<Search>
}) {
  const sp = await props.searchParams
  const aSlug = (sp.a ?? "").trim() || "nikola-jokic"
  const bSlug = (sp.b ?? "").trim() || "lebron-james"
  const [playerA, playerB] = await Promise.all([
    getPlayerForCompare(aSlug),
    getPlayerForCompare(bSlug),
  ])

  return (
    <div className="py-8 sm:py-10">
      <FadeIn>
        <header className="mb-6">
          <p className="text-xs uppercase tracking-widest text-brand-300 sm:text-sm">
            Matchup
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold text-ink-50 sm:text-4xl md:text-5xl">
            Side-by-side <span className="text-gradient-brand">scouting</span>
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-ink-300 sm:text-base">
            Pick any two players and compare their production on a per-game and
            efficiency basis. Green bar = leader for that line.
          </p>
        </header>
      </FadeIn>

      <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
        <FadeIn>
          <CompareSearch side="a" current={playerA} otherSlug={bSlug} />
        </FadeIn>
        <FadeIn>
          <CompareSearch side="b" current={playerB} otherSlug={aSlug} />
        </FadeIn>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:mt-8 sm:gap-6 md:grid-cols-[1fr_auto_1fr] md:items-stretch">
        <ComparePlayerCard side="a" player={playerA} requested={aSlug} />
        <div
          className="flex items-center justify-center md:flex-col"
          aria-hidden
        >
          <span className="hidden h-px w-full bg-white/10 md:block" />
          <span className="font-display text-xl font-bold text-ink-400 sm:text-2xl">
            VS
          </span>
          <span className="hidden h-px w-full bg-white/10 md:block" />
        </div>
        <ComparePlayerCard side="b" player={playerB} requested={bSlug} />
      </div>

      {playerA && playerB ? (
        <FadeIn>
          <section className="mt-6 rounded-2xl border border-accent-cyan/20 bg-gradient-to-br from-accent-cyan/5 via-white/[0.02] to-brand-500/5 p-4 sm:mt-8 sm:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="max-w-xl">
                <span className="inline-flex items-center gap-2 rounded-full border border-accent-cyan/30 bg-accent-cyan/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-accent-cyan sm:text-xs">
                  02 / Compare
                </span>
                <h2 className="mt-3 font-display text-2xl font-bold leading-[1.1] tracking-tight sm:text-3xl">
                  Two players,{" "}
                  <span className="text-gradient-brand">one screen.</span>
                </h2>
                <p className="mt-2 text-sm text-ink-200 sm:text-base">
                  El radar se rellena solo, las barras destacan al líder en
                  verde y los splits de tiro entran en formato donut. Y si
                  quieres una segunda opinión, la IA del scout te firma el
                  veredicto.
                </p>
              </div>
              <Link
                href="#ai-analysis"
                className="inline-flex items-center justify-center gap-2 rounded-md border border-brand-500/40 bg-brand-500/10 px-4 py-2.5 text-sm font-semibold text-brand-200 transition hover:border-brand-500/60 hover:bg-brand-500/20"
              >
                Ir al análisis IA
                <svg
                  className="h-4 w-4"
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
            </div>
          </section>
        </FadeIn>
      ) : null}

      {playerA && playerB ? (
        <FadeIn>
          <section className="mt-6 grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-[1.05fr_1fr]">
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 sm:p-5">
              <h2 className="mb-3 font-display text-sm uppercase tracking-widest text-ink-300">
                Multi-stat radar
              </h2>
              <div className="aspect-square w-full">
                <CompareRadar a={playerA} b={playerB} />
              </div>
              <p className="mt-3 text-xs text-ink-400">
                Cada eje se escala contra un máximo de élite — más superficie
                cubierta = perfil más completo.
              </p>
            </div>
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 sm:p-5">
              <h2 className="mb-3 font-display text-sm uppercase tracking-widest text-ink-300">
                Shooting splits
              </h2>
              <CompareShootingSplits
                aName={playerA.fullName}
                bName={playerB.fullName}
                splits={[
                  {
                    label: "FG%",
                    a: playerA.stats?.fgPct ?? null,
                    b: playerB.stats?.fgPct ?? null,
                  },
                  {
                    label: "3P%",
                    a: playerA.stats?.threePct ?? null,
                    b: playerB.stats?.threePct ?? null,
                  },
                  {
                    label: "FT%",
                    a: playerA.stats?.ftPct ?? null,
                    b: playerB.stats?.ftPct ?? null,
                  },
                ]}
              />
              <p className="mt-3 text-xs text-ink-400">
                Anillo exterior {playerA.fullName} (naranja), interior{" "}
                {playerB.fullName} (cyan). El número grande es el de{" "}
                {playerA.fullName}.
              </p>
            </div>
          </section>
        </FadeIn>
      ) : null}

      {playerA && playerB ? (
        <FadeIn>
          <section className="mt-6 rounded-2xl border border-white/5 bg-white/[0.02] p-4 sm:mt-8 sm:p-6">
            <h2 className="mb-4 font-display text-sm uppercase tracking-widest text-ink-300">
              Per-game production
            </h2>
            <div className="space-y-5">
              {STAT_KEYS.map((s) => {
                const av = playerA.stats?.[s.key as keyof typeof playerA.stats]
                const bv = playerB.stats?.[s.key as keyof typeof playerB.stats]
                const aN = typeof av === "number" ? av : null
                const bN = typeof bv === "number" ? bv : null
                return (
                  <CompareBar
                    key={s.key}
                    label={s.label}
                    aName={playerA.fullName}
                    bName={playerB.fullName}
                    a={aN}
                    b={bN}
                    max={s.max}
                    fmt={s.fmt}
                    lowerBetter={"lowerBetter" in s ? s.lowerBetter : false}
                  />
                )
              })}
            </div>
          </section>
        </FadeIn>
      ) : null}

      {playerA && playerB ? (
        <FadeIn>
          <div id="ai-analysis" className="mt-6 scroll-mt-20 sm:mt-8">
            <CompareAi
              aSlug={playerA.slug}
              bSlug={playerB.slug}
              aName={playerA.fullName}
              bName={playerB.fullName}
            />
          </div>
        </FadeIn>
      ) : null}
    </div>
  )
}

function ComparePlayerCard({
  side,
  player,
  requested,
}: {
  side: "a" | "b"
  player: Awaited<ReturnType<typeof getPlayerForCompare>>
  requested: string
}) {
  if (!player) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center sm:p-8">
        <p className="text-sm text-ink-200 sm:text-base">
          No player found for &quot;{requested}&quot;.
        </p>
        <p className="mt-1 text-xs text-ink-400">
          Search above to pick someone else.
        </p>
      </div>
    )
  }
  const initials = player.fullName
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
  return (
    <FadeIn>
      <article
        className={`rounded-2xl border border-white/5 bg-white/[0.02] p-4 sm:p-5 ${
          side === "a" ? "md:text-left" : "md:text-right"
        }`}
      >
        <div
          className={`flex items-center gap-3 sm:gap-4 ${
            side === "b" ? "md:flex-row-reverse" : ""
          }`}
        >
          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-court-800 ring-1 ring-white/5 sm:h-16 sm:w-16">
            <SmartImage
              src={player.photoUrl}
              alt={player.fullName}
              fit="cover"
              eager
              fallbackClassName="text-sm font-bold text-brand-300"
              fallback={initials}
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-base font-bold text-ink-50 sm:text-lg">
              <Link
                href={`/players/${player.slug}`}
                className="transition hover:text-brand-300"
              >
                {player.fullName}
              </Link>
            </p>
            <p className="truncate text-[11px] text-ink-300 sm:text-xs">
              {player.team?.name ?? "Free agent"} · {player.league.name}
            </p>
            <p className="mt-1 truncate text-[10px] uppercase tracking-widest text-ink-400">
              {player.position ?? "—"} · {player.nationality ?? "—"}
            </p>
          </div>
        </div>
        {player.stats ? (
          <p className="mt-3 font-mono text-[11px] text-ink-300 sm:text-xs">
            Season {player.stats.year} · {player.stats.gamesPlayed} GP
          </p>
        ) : (
          <p className="mt-3 text-xs text-ink-400">No stats available.</p>
        )}
      </article>
    </FadeIn>
  )
}
