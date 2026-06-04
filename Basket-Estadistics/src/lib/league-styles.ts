export type LeagueThemeKey = "nba" | "euroleague" | "acb"

export type LeagueTheme = {
  key: LeagueThemeKey
  label: string
  accentText: string
  accentBg: string
  accentBorder: string
  ring: string
  glowVar: string
  chip: string
  divider: string
  numeralBg: string
}

const THEME: Record<LeagueThemeKey, LeagueTheme> = {
  nba: {
    key: "nba",
    label: "NBA",
    accentText: "text-league-nba-500",
    accentBg: "bg-league-nba-500",
    accentBorder: "border-league-nba-500/40",
    ring: "ring-league-nba-500/40",
    glowVar: "var(--shadow-league-nba)",
    chip: "bg-league-nba-500/15 text-league-nba-300 border-league-nba-500/30",
    divider: "via-league-nba-500/60",
    numeralBg: "bg-league-nba-500/20 text-league-nba-300",
  },
  euroleague: {
    key: "euroleague",
    label: "EuroLeague",
    accentText: "text-league-euro-500",
    accentBg: "bg-league-euro-500",
    accentBorder: "border-league-euro-500/40",
    ring: "ring-league-euro-500/40",
    glowVar: "var(--shadow-league-euro)",
    chip: "bg-league-euro-500/15 text-league-euro-300 border-league-euro-500/30",
    divider: "via-league-euro-500/60",
    numeralBg: "bg-league-euro-500/20 text-league-euro-300",
  },
  acb: {
    key: "acb",
    label: "ACB",
    accentText: "text-league-acb-500",
    accentBg: "bg-league-acb-500",
    accentBorder: "border-league-acb-500/40",
    ring: "ring-league-acb-500/40",
    glowVar: "var(--shadow-league-acb)",
    chip: "bg-league-acb-500/15 text-league-acb-300 border-league-acb-500/30",
    divider: "via-league-acb-500/60",
    numeralBg: "bg-league-acb-500/20 text-league-acb-300",
  },
}

export function getLeagueTheme(slug: string | null | undefined): LeagueTheme {
  const key = (slug ?? "").toLowerCase() as LeagueThemeKey
  return THEME[key] ?? THEME.nba
}
