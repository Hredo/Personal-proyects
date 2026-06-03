import Link from "next/link"
import type { Metadata } from "next"
import { listLeagues } from "@/lib/data/players"
import { FadeIn } from "@/components/animations/fade-in"

export const metadata: Metadata = {
  title: "Leagues",
  description:
    "NBA, EuroLeague and Liga ACB — see how many teams and players are in our database for each league.",
}

export default async function LeaguesPage() {
  const leagues = await listLeagues()
  return (
    <div className="py-8 sm:py-10">
      <FadeIn>
        <header className="mb-6 sm:mb-8">
          <p className="text-xs uppercase tracking-widest text-brand-300 sm:text-sm">
            Coverage
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold text-ink-50 sm:text-4xl md:text-5xl">
            Leagues
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-ink-300 sm:text-base">
            Three professional leagues. Click any league to filter the player
            directory.
          </p>
        </header>
      </FadeIn>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        {leagues.map((lg) => (
          <FadeIn key={lg.id}>
            <Link
              href={`/players?league=${lg.slug}`}
              className="group block rounded-2xl border border-white/5 bg-white/[0.02] p-5 transition hover:border-brand-500/40 hover:bg-white/[0.05] sm:p-6"
            >
              <p className="text-xs uppercase tracking-widest text-ink-300">
                {lg.country}
              </p>
              <h2 className="mt-2 font-display text-xl font-bold text-ink-50 group-hover:text-brand-300 sm:text-2xl">
                {lg.name}
              </h2>
              <div className="mt-4 flex gap-6 text-sm text-ink-300">
                <div>
                  <p className="font-mono text-xl font-bold text-ink-50 sm:text-2xl">
                    {lg.teamCount}
                  </p>
                  <p className="text-[10px] uppercase tracking-widest text-ink-400">
                    Teams
                  </p>
                </div>
                <div>
                  <p className="font-mono text-xl font-bold text-ink-50 sm:text-2xl">
                    {lg.playerCount}
                  </p>
                  <p className="text-[10px] uppercase tracking-widest text-ink-400">
                    Players
                  </p>
                </div>
              </div>
            </Link>
          </FadeIn>
        ))}
      </div>
    </div>
  )
}
