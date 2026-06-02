import { sql } from "drizzle-orm"
import {
  index,
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core"

const uuid = () => crypto.randomUUID()
const now = () => new Date()

export const leagues = sqliteTable("leagues", {
  id: text("id")
    .primaryKey()
    .$defaultFn(uuid),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  country: text("country").notNull(),
  logoUrl: text("logo_url"),
  source: text("source").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(now),
})

export const seasons = sqliteTable(
  "seasons",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(uuid),
    leagueId: text("league_id")
      .notNull()
      .references(() => leagues.id, { onDelete: "cascade" }),
    year: integer("year").notNull(),
    name: text("name").notNull(),
  },
  (t) => [uniqueIndex("seasons_league_year_idx").on(t.leagueId, t.year)],
)

export const teams = sqliteTable(
  "teams",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(uuid),
    leagueId: text("league_id")
      .notNull()
      .references(() => leagues.id, { onDelete: "cascade" }),
    sourceId: text("source_id").notNull(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    logoUrl: text("logo_url"),
    country: text("country"),
    city: text("city"),
    shortName: text("short_name"),
    foundedYear: integer("founded_year"),
    arena: text("arena"),
    arenaCapacity: integer("arena_capacity"),
    websiteUrl: text("website_url"),
    primaryColor: text("primary_color"),
  },
  (t) => [
    uniqueIndex("teams_league_source_idx").on(t.leagueId, t.sourceId),
    uniqueIndex("teams_league_slug_idx").on(t.leagueId, t.slug),
  ],
)

export const coaches = sqliteTable(
  "coaches",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(uuid),
    teamId: text("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    leagueId: text("league_id")
      .notNull()
      .references(() => leagues.id, { onDelete: "cascade" }),
    source: text("source").notNull(),
    sourceId: text("source_id").notNull(),
    fullName: text("full_name").notNull(),
    slug: text("slug").notNull(),
    role: text("role").notNull(),
    nationality: text("nationality"),
    age: integer("age"),
    photoUrl: text("photo_url"),
    licenseType: text("license_type"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(now),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(now),
  },
  (t) => [
    uniqueIndex("coaches_source_source_id_idx").on(t.source, t.sourceId),
    index("coaches_team_idx").on(t.teamId),
  ],
)

export const teamSeasonStats = sqliteTable(
  "team_season_stats",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    teamId: text("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    seasonId: text("season_id")
      .notNull()
      .references(() => seasons.id, { onDelete: "cascade" }),
    gamesPlayed: integer("games_played").notNull().default(0),
    wins: integer("wins").notNull().default(0),
    losses: integer("losses").notNull().default(0),
    winPct: real("win_pct"),
    pointsFor: real("points_for"),
    pointsAgainst: real("points_against"),
    position: integer("position"),
    pace: real("pace"),
    offRtg: real("off_rtg"),
    defRtg: real("def_rtg"),
    netRtg: real("net_rtg"),
    sos: real("sos"),
  },
  (t) => [
    uniqueIndex("team_season_stats_team_season_idx").on(
      t.teamId,
      t.seasonId,
    ),
  ],
)

export const players = sqliteTable(
  "players",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(uuid),
    fullName: text("full_name").notNull(),
    slug: text("slug").notNull().unique(),
    birthdate: text("birthdate"),
    nationality: text("nationality"),
    position: text("position"),
    heightCm: integer("height_cm"),
    weightKg: integer("weight_kg"),
    currentTeamId: text("current_team_id").references(() => teams.id, {
      onDelete: "set null",
    }),
    photoUrl: text("photo_url"),
    source: text("source").notNull(),
    sourceId: text("source_id").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(now),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(now),
  },
  (t) => [
    uniqueIndex("players_source_source_id_idx").on(t.source, t.sourceId),
    index("players_full_name_idx").on(t.fullName),
  ],
)

export const playerStats = sqliteTable(
  "player_stats",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    playerId: text("player_id")
      .notNull()
      .references(() => players.id, { onDelete: "cascade" }),
    seasonId: text("season_id")
      .notNull()
      .references(() => seasons.id, { onDelete: "cascade" }),
    teamId: text("team_id").references(() => teams.id, {
      onDelete: "set null",
    }),
    gamesPlayed: integer("games_played").notNull().default(0),
    minutesPerGame: real("minutes_per_game"),
    points: real("points"),
    rebounds: real("rebounds"),
    assists: real("assists"),
    steals: real("steals"),
    blocks: real("blocks"),
    turnovers: real("turnovers"),
    fgPct: real("fg_pct"),
    threePct: real("three_pct"),
    ftPct: real("ft_pct"),
    offRtg: real("off_rtg"),
    defRtg: real("def_rtg"),
    per: real("per"),
    winShares: real("win_shares"),
    bpm: real("bpm"),
  },
  (t) => [
    uniqueIndex("player_stats_player_season_idx").on(t.playerId, t.seasonId),
    index("player_stats_season_idx").on(t.seasonId),
  ],
)

export const videos = sqliteTable(
  "videos",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    playerId: text("player_id")
      .notNull()
      .references(() => players.id, { onDelete: "cascade" }),
    youtubeId: text("youtube_id").notNull(),
    title: text("title").notNull(),
    thumbnailUrl: text("thumbnail_url").notNull(),
    publishedAt: integer("published_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(now),
  },
  (t) => [uniqueIndex("videos_youtube_id_idx").on(t.youtubeId)],
)

export const syncRuns = sqliteTable("sync_runs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  source: text("source").notNull(),
  startedAt: integer("started_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(now),
  finishedAt: integer("finished_at", { mode: "timestamp" }),
  status: text("status").notNull(),
  error: text("error"),
  rowsWritten: integer("rows_written").notNull().default(0),
})

export const shortlists = sqliteTable("shortlists", {
  id: text("id")
    .primaryKey()
    .$defaultFn(uuid),
  ownerId: text("owner_id").notNull(),
  name: text("name").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(now),
})

export const shortlistPlayers = sqliteTable(
  "shortlist_players",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    shortlistId: text("shortlist_id")
      .notNull()
      .references(() => shortlists.id, { onDelete: "cascade" }),
    playerId: text("player_id")
      .notNull()
      .references(() => players.id, { onDelete: "cascade" }),
    notes: text("notes"),
    addedAt: integer("added_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(now),
  },
  (t) => [
    uniqueIndex("shortlist_players_unique_idx").on(t.shortlistId, t.playerId),
  ],
)

export type League = typeof leagues.$inferSelect
export type Season = typeof seasons.$inferSelect
export type Team = typeof teams.$inferSelect
export type Coach = typeof coaches.$inferSelect
export type TeamSeasonStat = typeof teamSeasonStats.$inferSelect
export type Player = typeof players.$inferSelect
export type PlayerStat = typeof playerStats.$inferSelect
export type Video = typeof videos.$inferSelect
export type SyncRun = typeof syncRuns.$inferSelect
export type Shortlist = typeof shortlists.$inferSelect

export const ftsPlayers = sql`
  CREATE VIRTUAL TABLE IF NOT EXISTS players_fts USING fts5(
    full_name,
    nationality,
    content='players',
    content_rowid='rowid'
  )
`
