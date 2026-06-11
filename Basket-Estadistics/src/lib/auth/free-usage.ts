// NOTE: Imports kept for when usage limits are re-enabled.
// import { and, eq, sql } from "drizzle-orm"
// import { getDb } from "@/lib/db/client"
// import {
//   compareUses,
//   conversations,
//   userPlan,
// } from "@/lib/db/schema"

// NOTE: FREE_AI_LIMIT kept for when usage limits are re-enabled.
// export const FREE_AI_LIMIT = 1

export type FreeUsage = {
  count: number
  remaining: number
  limit: number
}

export async function getAdvisorFreeUsage(
  _userId: string,
  _plan: string,
  _role: string,
): Promise<FreeUsage> {
  // NOTE: Usage limits disabled until re-enabled later.
  return { count: 0, remaining: Infinity, limit: Infinity }
}

export async function getCompareFreeUsage(
  _userId: string,
  _plan: string,
  _role: string,
): Promise<FreeUsage> {
  // NOTE: Usage limits disabled until re-enabled later.
  return { count: 0, remaining: Infinity, limit: Infinity }
}

// NOTE: Functions kept for when usage limits are re-enabled (need imports restored).
// export async function recordAdvisorUse(userId: string): Promise<void> {
//   const db = getDb()
//   await db.insert(conversations).values({
//     userId,
//     teamSlug: "__free__",
//     teamName: "Free preview",
//     leagueSlug: "__free__",
//     title: "Free preview",
//   })
// }

// export async function recordCompareUse(userId: string): Promise<void> {
//   const db = getDb()
//   await db.insert(compareUses).values({ userId })
// }

// export async function findExistingFreeAdvisorConversation(
//   userId: string,
//   teamSlug: string,
//   leagueSlug: string,
// ): Promise<string | null> {
//   const db = getDb()
//   const rows = await db
//     .select({ id: conversations.id })
//     .from(conversations)
//     .where(
//       and(
//         eq(conversations.userId, userId),
//         eq(conversations.teamSlug, teamSlug),
//         eq(conversations.leagueSlug, leagueSlug),
//       ),
//     )
//     .limit(1)
//   return rows[0]?.id ?? null
// }
