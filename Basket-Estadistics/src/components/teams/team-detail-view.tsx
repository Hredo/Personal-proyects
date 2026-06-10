import { FadeIn } from "@/components/animations/fade-in"
import { TeamHero } from "@/components/teams/team-hero"
import { TeamRosterGrid } from "@/components/teams/team-roster-grid"
import { TeamStaffList } from "@/components/teams/team-staff-list"
import { TeamThemeScope } from "@/components/teams/team-theme-scope"

type Props = {
  team: {
    id: string
    name: string
    slug: string
    logoUrl: string | null
    city: string | null
    league: { name: string; slug: string; region: string }
    roster: Parameters<typeof TeamRosterGrid>[0]["players"]
    staff: Parameters<typeof TeamStaffList>[0]["staff"]
  }
}

export function TeamDetailView({ team }: Props) {
  const palette = null
  return (
    <TeamThemeScope palette={palette}>
      <div className="team-detail-page py-8">
        <FadeIn>
          <TeamHero
            name={team.name}
            logoUrl={team.logoUrl}
            league={team.league}
            city={team.city}
          />
        </FadeIn>

        <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
          <FadeIn delay={0.05}>
            <section>
              <header className="mb-4 flex items-end justify-between">
                <h2 className="font-display text-xl font-bold text-ink-50">
                  <span
                    className="bg-clip-text text-transparent"
                    style={{
                      backgroundImage:
                        "linear-gradient(120deg, var(--team-300), var(--team-500))",
                    }}
                  >
                    Roster
                  </span>{" "}
                  <span className="text-ink-300">· {team.roster.length}</span>
                </h2>
                <span className="text-xs uppercase tracking-widest text-ink-400">
                  Current season
                </span>
              </header>
              <TeamRosterGrid players={team.roster} />
            </section>
          </FadeIn>

          <FadeIn delay={0.1}>
            <TeamStaffList staff={team.staff} />
          </FadeIn>
        </div>
      </div>
    </TeamThemeScope>
  )
}
