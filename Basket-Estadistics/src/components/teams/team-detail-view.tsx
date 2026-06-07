import { FadeIn } from "@/components/animations/fade-in"
import { TeamHero } from "@/components/teams/team-hero"
import { TeamRosterGrid } from "@/components/teams/team-roster-grid"
import { TeamStaffList } from "@/components/teams/team-staff-list"
import { TeamThemeScope } from "@/components/teams/team-theme-scope"
import { buildTeamPalette, type TeamPalette } from "@/lib/theme/team-color"
import { TEAM_COLORS_BY_SOURCE } from "@/lib/theme/team-colors"

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
    arenaCapacity: number | null
    websiteUrl: string | null
    primaryColor: string | null
    sourceId: string
    league: { name: string; slug: string; country: string }
    roster: Parameters<typeof TeamRosterGrid>[0]["players"]
    staff: Parameters<typeof TeamStaffList>[0]["staff"]
  }
}

function resolveColor(
  primaryColor: string | null,
  leagueSlug: string,
  sourceId: string,
): string | null {
  if (primaryColor) return primaryColor
  const map = TEAM_COLORS_BY_SOURCE[leagueSlug]
  if (!map) return null
  return map[sourceId] ?? null
}

function buildPaletteFor(
  primaryColor: string | null,
  leagueSlug: string,
  sourceId: string,
): TeamPalette | null {
  const hex = resolveColor(primaryColor, leagueSlug, sourceId)
  if (!hex) return null
  return buildTeamPalette(hex, leagueSlug)
}

export function TeamDetailView({ team }: Props) {
  const palette = buildPaletteFor(
    team.primaryColor,
    team.league.slug,
    team.sourceId,
  )
  return (
    <TeamThemeScope palette={palette}>
      <div className="team-detail-page py-8">
        <FadeIn>
          <TeamHero
            name={team.name}
            shortName={team.shortName}
            logoUrl={team.logoUrl}
            league={team.league}
            city={team.city}
            country={team.country}
            foundedYear={team.foundedYear}
            arena={team.arena}
            arenaCapacity={team.arenaCapacity}
            websiteUrl={team.websiteUrl}
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
