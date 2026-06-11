export type SourceId =
  | "nba"
  | "acb"
  | "euroleague"
  | "leb-oro"
  | "leb-plata"
  | "eba"

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
  "leb-oro": {
    displayName: "LEB Oro",
    country: "ES",
    seasonCode: "2025-26",
    season: 2025,
  },
  "leb-plata": {
    displayName: "LEB Plata",
    country: "ES",
    seasonCode: "2025-26",
    season: 2025,
  },
  eba: {
    displayName: "Liga EBA",
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
  secondaryColor?: string
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

export type ExtractedPlayerStat = {
  playerSourceId: string
  teamSourceId?: string
  season: number
  gamesPlayed: number
  minutesTotal: number | null
  pointsTotal: number | null
  reboundsTotal: number | null
  assistsTotal: number | null
  stealsTotal: number | null
  blocksTotal: number | null
  fgMade: number | null
  fgAttempted: number | null
  threeMade: number | null
  threeAttempted: number | null
  ftMade: number | null
  ftAttempted: number | null
  offensiveRebounds: number | null
  defensiveRebounds: number | null
  foulsTotal: number | null
  plusMinus: number | null
  per: number | null
  trueShootingPct: number | null
  winShares: number | null
  bpm: number | null
}

export type SourceAdapter = {
  id: SourceId
  displayName: string
  country: string
  season: number
  seasonCode: string
  fetchTeams(): Promise<SourceTeam[]>
  fetchPlayers(): Promise<SourcePlayer[]>
  fetchStats(): Promise<ExtractedPlayerStat[]>
  fetchCoaches(): Promise<SourceCoach[]>
  fetchTeamStats(): Promise<SourceTeamStats[]>
  fetchTeamDetails?(
    teamIds: string[],
  ): Promise<Map<string, Partial<SourceTeam> & Record<string, unknown>>>
}
