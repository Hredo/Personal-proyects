export type SourceId = "nba" | "acb" | "euroleague"

export const CURRENT_SEASON = 2025

export const SOURCE_META: Record<
  SourceId,
  {
    displayName: string
    country: string
    seasonCode: string
    season: number
  }
> = {
  nba: {
    displayName: "NBA",
    country: "USA",
    seasonCode: "2025-26",
    season: 2025,
  },
  euroleague: {
    displayName: "EuroLeague",
    country: "EU",
    seasonCode: "E2025",
    season: 2025,
  },
  acb: {
    displayName: "Liga Endesa",
    country: "ES",
    seasonCode: "2025-26",
    season: 2025,
  },
}

export type SourceTeam = {
  sourceId: string
  name: string
  shortName?: string
  country?: string
  city?: string
  logoUrl?: string
  foundedYear?: number
  arena?: string
  arenaCapacity?: number
  websiteUrl?: string
  primaryColor?: string
}

export type SourcePlayer = {
  sourceId: string
  fullName: string
  birthdate?: string
  nationality?: string
  position?: string
  jerseyNumber?: string
  age?: number
  heightCm?: number
  weightKg?: number
  teamSourceId?: string
  photoUrl?: string
  licenseType?: string
}

export type SourceStats = {
  playerSourceId: string
  season: number
  teamSourceId?: string
  gamesPlayed: number
  minutesPerGame?: number
  points?: number
  rebounds?: number
  assists?: number
  steals?: number
  blocks?: number
  turnovers?: number
  fgPct?: number
  threePct?: number
  ftPct?: number
}

export type SourceCoach = {
  sourceId: string
  fullName: string
  role: "head_coach" | "assistant_coach" | "staff"
  teamSourceId?: string
  nationality?: string
  age?: number
  photoUrl?: string
  licenseType?: string
}

export type SourceTeamStats = {
  teamSourceId: string
  season: number
  gamesPlayed: number
  wins: number
  losses: number
  winPct?: number
  pointsFor?: number
  pointsAgainst?: number
  position?: number
  pace?: number
  offRtg?: number
  defRtg?: number
  netRtg?: number
  sos?: number
}

export type SourceAdapter = {
  id: SourceId
  displayName: string
  country: string
  season: number
  seasonCode: string
  fetchTeams(): Promise<SourceTeam[]>
  fetchPlayers(): Promise<SourcePlayer[]>
  fetchStats(): Promise<SourceStats[]>
  fetchCoaches(): Promise<SourceCoach[]>
  fetchTeamStats(): Promise<SourceTeamStats[]>
  fetchTeamDetails?(
    teamIds: string[],
  ): Promise<Map<string, Partial<SourceTeam> & Record<string, unknown>>>
}
