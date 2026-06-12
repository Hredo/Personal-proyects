import {
  pgTable,
  uuid,
  text,
  integer,
  serial,
  doublePrecision,
  boolean,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core"

export const leagues = pgTable("leagues", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  region: text("region").notNull(),
  logoUrl: text("logo_url"),
})

export const seasons = pgTable("seasons", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  isCurrent: boolean("is_current").notNull().default(false),
})

export const teams = pgTable(
  "teams",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    city: text("city"),
    logoUrl: text("logo_url"),
    foundedYear: integer("founded_year"),
    website: text("website"),
    arena: text("arena"),
    primaryColor: text("primary_color"),
    secondaryColor: text("secondary_color"),
  },
  (t) => [
    uniqueIndex("teams_slug_idx").on(t.slug),
    index("teams_name_idx").on(t.name),
  ],
)

export const players = pgTable(
  "players",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    slug: text("slug").notNull().unique(),
    bio: text("bio"),
    imageUrl: text("image_url"),
    position: text("position"),
    heightCm: integer("height_cm"),
    weightKg: integer("weight_kg"),
    nationality: text("nationality"),
  },
  (t) => [
    index("players_last_name_idx").on(t.lastName),
    index("players_position_idx").on(t.position),
  ],
)

export const playerSeasonStats = pgTable(
  "player_season_stats",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    playerId: uuid("player_id")
      .notNull()
      .references(() => players.id, { onDelete: "cascade" }),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    leagueId: uuid("league_id")
      .notNull()
      .references(() => leagues.id, { onDelete: "cascade" }),
    seasonId: uuid("season_id")
      .notNull()
      .references(() => seasons.id, { onDelete: "cascade" }),
    gamesPlayed: integer("games_played").notNull().default(0),
    minutesTotal: integer("minutes_total"),
    pointsTotal: integer("points_total"),
    reboundsTotal: integer("rebounds_total"),
    assistsTotal: integer("assists_total"),
    stealsTotal: integer("steals_total"),
    blocksTotal: integer("blocks_total"),
    fgMade: integer("fg_made"),
    fgAttempted: integer("fg_attempted"),
    threeMade: integer("three_made"),
    threeAttempted: integer("three_attempted"),
    ftMade: integer("ft_made"),
    ftAttempted: integer("ft_attempted"),
    offensiveRebounds: integer("offensive_rebounds"),
    defensiveRebounds: integer("defensive_rebounds"),
    foulsTotal: integer("fouls_total"),
    plusMinus: integer("plus_minus"),
    per: doublePrecision("per"),
    trueShootingPct: doublePrecision("true_shooting_pct"),
    winShares: doublePrecision("win_shares"),
    bpm: doublePrecision("bpm"),
  },
  (t) => [
    uniqueIndex("player_season_stats_unique_idx").on(
      t.playerId,
      t.teamId,
      t.leagueId,
      t.seasonId,
    ),
    index("player_season_stats_player_idx").on(t.playerId),
    index("player_season_stats_league_season_idx").on(t.leagueId, t.seasonId),
    index("player_season_stats_team_season_idx").on(t.teamId, t.seasonId),
    index("player_season_stats_points_idx").on(t.pointsTotal),
  ],
)

export const coaches = pgTable(
  "coaches",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    leagueId: uuid("league_id")
      .notNull()
      .references(() => leagues.id, { onDelete: "cascade" }),
    fullName: text("full_name").notNull(),
    slug: text("slug").notNull(),
    role: text("role").notNull(),
    nationality: text("nationality"),
    age: integer("age"),
    photoUrl: text("photo_url"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("coaches_team_role_idx").on(t.teamId, t.leagueId, t.slug),
    index("coaches_league_name_idx").on(t.leagueId, t.fullName),
  ],
)

export const teamSeasonStats = pgTable(
  "team_season_stats",
  {
    id: serial("id").primaryKey(),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    seasonId: uuid("season_id")
      .notNull()
      .references(() => seasons.id, { onDelete: "cascade" }),
    leagueId: uuid("league_id")
      .notNull()
      .references(() => leagues.id, { onDelete: "cascade" }),
    gamesPlayed: integer("games_played").notNull().default(0),
    wins: integer("wins").notNull().default(0),
    losses: integer("losses").notNull().default(0),
    winPct: doublePrecision("win_pct"),
    pointsFor: doublePrecision("points_for"),
    pointsAgainst: doublePrecision("points_against"),
    position: integer("position"),
    pace: doublePrecision("pace"),
    offRtg: doublePrecision("off_rtg"),
    defRtg: doublePrecision("def_rtg"),
    netRtg: doublePrecision("net_rtg"),
    sos: doublePrecision("sos"),
  },
  (t) => [
    uniqueIndex("team_season_stats_team_season_league_idx").on(
      t.teamId,
      t.seasonId,
      t.leagueId,
    ),
  ],
)

export const videos = pgTable(
  "videos",
  {
    id: serial("id").primaryKey(),
    playerId: uuid("player_id")
      .notNull()
      .references(() => players.id, { onDelete: "cascade" }),
    youtubeId: text("youtube_id").notNull(),
    title: text("title").notNull(),
    thumbnailUrl: text("thumbnail_url").notNull(),
    publishedAt: timestamp("published_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("videos_youtube_id_idx").on(t.youtubeId)],
)

export const syncRuns = pgTable("sync_runs", {
  id: serial("id").primaryKey(),
  source: text("source").notNull(),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  finishedAt: timestamp("finished_at"),
  status: text("status").notNull(),
  error: text("error"),
  rowsWritten: integer("rows_written").notNull().default(0),
})

export const shortlists = pgTable("shortlists", {
  id: uuid("id").defaultRandom().primaryKey(),
  ownerId: text("owner_id").notNull(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

export const waitlistEntries = pgTable(
  "waitlist_entries",
  {
    id: serial("id").primaryKey(),
    email: text("email").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    source: text("source"),
  },
  (t) => [uniqueIndex("waitlist_entries_email_idx").on(t.email)],
)

export const shortlistPlayers = pgTable(
  "shortlist_players",
  {
    id: serial("id").primaryKey(),
    shortlistId: uuid("shortlist_id")
      .notNull()
      .references(() => shortlists.id, { onDelete: "cascade" }),
    playerId: uuid("player_id")
      .notNull()
      .references(() => players.id, { onDelete: "cascade" }),
    notes: text("notes"),
    addedAt: timestamp("added_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("shortlist_players_unique_idx").on(t.shortlistId, t.playerId),
  ],
)

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull(),
    name: text("name").notNull(),
    passwordHash: text("password_hash"),
    twoFactorEnabled: boolean("two_factor_enabled").notNull().default(false),
    plan: text("plan").notNull().default("free"),
    role: text("role").notNull().default("user"),
    proSince: timestamp("pro_since"),
    stripeCustomerId: text("stripe_customer_id"),
    stripeSubscriptionId: text("stripe_subscription_id"),
    planRenewsAt: timestamp("plan_renews_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("users_email_idx").on(t.email)],
)

export const userApiKeys = pgTable(
  "user_api_keys",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(),
    encryptedKey: text("encrypted_key").notNull(),
    last4: text("last4").notNull(),
    label: text("label"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("user_api_keys_user_provider_idx").on(t.userId, t.provider),
  ],
)

export const userSettings = pgTable("user_settings", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  advisorProvider: text("advisor_provider"),
  advisorModel: text("advisor_model"),
  compareProvider: text("compare_provider"),
  compareModel: text("compare_model"),
  locale: text("locale").notNull().default("en"),
  emailProduct: boolean("email_product").notNull().default(true),
  emailUsage: boolean("email_usage").notNull().default(false),
  reduceMotion: boolean("reduce_motion").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at").notNull(),
    userAgent: text("user_agent"),
    ip: text("ip"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("sessions_user_idx").on(t.userId),
    index("sessions_expires_idx").on(t.expiresAt),
  ],
)

export const conversations = pgTable(
  "conversations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    teamId: text("team_id"),
    teamSlug: text("team_slug").notNull(),
    teamName: text("team_name").notNull(),
    leagueSlug: text("league_slug").notNull(),
    title: text("title").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("conversations_user_idx").on(t.userId, t.updatedAt)],
)

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    role: text("role").notNull(),
    content: text("content").notNull(),
    model: text("model"),
    mode: text("mode"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("messages_conversation_idx").on(t.conversationId, t.createdAt),
  ],
)

export const compareUses = pgTable(
  "compare_uses",
  {
    id: serial("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    usedAt: timestamp("used_at").notNull().defaultNow(),
  },
  (t) => [index("compare_uses_user_idx").on(t.userId)],
)

export const passwordResetTokens = pgTable(
  "password_reset_tokens",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    used: boolean("used").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("password_reset_tokens_user_idx").on(t.userId)],
)

export const twoFactorSessions = pgTable(
  "two_factor_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    codeHash: text("code_hash").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    verified: boolean("verified").notNull().default(false),
    attempts: integer("attempts").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("two_factor_sessions_user_idx").on(t.userId),
    index("two_factor_sessions_expires_idx").on(t.expiresAt),
  ],
)

export const twoFactorBackupCodes = pgTable(
  "two_factor_backup_codes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    codeHash: text("code_hash").notNull(),
    used: boolean("used").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("two_factor_backup_codes_user_idx").on(t.userId),
  ],
)

export type Plan = "free" | "pro"

export function userPlan(
  u: { plan: string; role: string } | null | undefined,
): Plan | "admin" {
  if (!u) return "free"
  if (u.role === "admin") return "admin"
  return u.plan === "pro" ? "pro" : "free"
}

export type League = typeof leagues.$inferSelect
export type Season = typeof seasons.$inferSelect
export type Team = typeof teams.$inferSelect
export type Player = typeof players.$inferSelect
export type PlayerSeasonStat = typeof playerSeasonStats.$inferSelect
export type Coach = typeof coaches.$inferSelect
export type TeamSeasonStat = typeof teamSeasonStats.$inferSelect
export type Video = typeof videos.$inferSelect
export type SyncRun = typeof syncRuns.$inferSelect
export type Shortlist = typeof shortlists.$inferSelect
export type WaitlistEntry = typeof waitlistEntries.$inferSelect
export type User = typeof users.$inferSelect
export type Session = typeof sessions.$inferSelect
export type Conversation = typeof conversations.$inferSelect
export type Message = typeof messages.$inferSelect
export type UserApiKey = typeof userApiKeys.$inferSelect
export type UserSettings = typeof userSettings.$inferSelect
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect
export type TwoFactorSession = typeof twoFactorSessions.$inferSelect
export type TwoFactorBackupCode = typeof twoFactorBackupCodes.$inferSelect
