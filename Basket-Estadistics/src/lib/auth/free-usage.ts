import { and, eq, sql } from "drizzle-orm"
import { getDb } from "@/lib/db/client"
import {
  compareUses,
  conversations,
  userPlan,
} from "@/lib/db/schema"

export const FREE_AI_LIMIT = 1

export type FreeUsage = {
  count: number
  remaining: number
  limit: number
}

export async function getAdvisorFreeUsage(
  userId: string,
  plan: string,
  role: string,
): Promise<FreeUsage> {
  if (userPlan({ plan, role }) !== "free") {
    return { count: 0, remaining: Infinity, limit: Infinity }
  }
  const db = getDb()
  const row = await db
    .select({ c: sql<number>`count(*)` })
    .from(conversations)
    .where(eq(conversations.userId, userId))
  const count = Number(row[0]?.c ?? 0)
  const remaining = Math.max(0, FREE_AI_LIMIT - count)
  return { count, remaining, limit: FREE_AI_LIMIT }
}

export async function getCompareFreeUsage(
  userId: string,
  plan: string,
  role: string,
): Promise<FreeUsage> {
  if (userPlan({ plan, role }) !== "free") {
    return { count: 0, remaining: Infinity, limit: Infinity }
  }
  const db = getDb()
  const row = await db
    .select({ c: sql<number>`count(*)` })
    .from(compareUses)
    .where(eq(compareUses.userId, userId))
  const count = Number(row[0]?.c ?? 0)
  const remaining = Math.max(0, FREE_AI_LIMIT - count)
  return { count, remaining, limit: FREE_AI_LIMIT }
}

export async function recordAdvisorUse(userId: string): Promise<void> {
  const db = getDb()
  await db.insert(conversations).values({
    userId,
    teamSlug: "__free__",
    teamName: "Free preview",
    leagueSlug: "__free__",
    title: "Free preview",
  })
}

export async function recordCompareUse(userId: string): Promise<void> {
  const db = getDb()
  await db.insert(compareUses).values({ userId })
}

export async function findExistingFreeAdvisorConversation(
  userId: string,
  teamSlug: string,
  leagueSlug: string,
): Promise<string | null> {
  const db = getDb()
  const rows = await db
    .select({ id: conversations.id })
    .from(conversations)
    .where(
      and(
        eq(conversations.userId, userId),
        eq(conversations.teamSlug, teamSlug),
        eq(conversations.leagueSlug, leagueSlug),
      ),
    )
    .limit(1)
  return rows[0]?.id ?? null
}
