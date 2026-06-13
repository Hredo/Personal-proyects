/**
 * Persistent, atomic rate limiter backed by Postgres.
 *
 * The in-memory token buckets in `ai-advisor.ts` reset on every cold start and
 * are not shared across serverless instances, so on a platform like Netlify
 * they barely limit anything. This limiter keeps one row per `key` in the
 * `rate_limits` table and increments it atomically with a single
 * `INSERT ... ON CONFLICT` statement, so the count is consistent across
 * concurrent invocations.
 *
 * Model: fixed window. The first request in a window sets `expires_at`; once it
 * passes, the next request resets the counter. Good enough for anti-abuse /
 * anti-brute-force on auth and contact endpoints.
 */
import { sql } from "drizzle-orm"
import { getDb } from "@/lib/db/client"

export type RateLimitResult =
  | { ok: true; remaining: number }
  | { ok: false; retryAfterSec: number }

/**
 * Consume one unit against `key`. Returns `ok: false` with a `Retry-After`
 * hint once more than `limit` requests arrive within `windowMs`.
 *
 * Fails OPEN: if the store is unreachable we allow the request rather than
 * lock everyone out — the endpoints still enforce auth and input validation.
 */
export async function consumeRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const db = getDb()
  const windowSec = Math.max(1, Math.ceil(windowMs / 1000))

  try {
    const rows = (await db.execute(sql`
      INSERT INTO rate_limits (key, count, expires_at)
      VALUES (${key}, 1, now() + (${windowSec} * interval '1 second'))
      ON CONFLICT (key) DO UPDATE SET
        count = CASE
          WHEN rate_limits.expires_at < now() THEN 1
          ELSE rate_limits.count + 1
        END,
        expires_at = CASE
          WHEN rate_limits.expires_at < now()
            THEN now() + (${windowSec} * interval '1 second')
          ELSE rate_limits.expires_at
        END
      RETURNING count, expires_at
    `)) as unknown as Array<{ count: number; expires_at: string | Date }>

    const row = rows[0]
    if (!row) return { ok: true, remaining: limit - 1 }

    const count = Number(row.count)
    if (count > limit) {
      const expiresMs = new Date(row.expires_at).getTime()
      const retryAfterSec = Math.max(
        1,
        Math.ceil((expiresMs - Date.now()) / 1000),
      )
      return { ok: false, retryAfterSec }
    }

    // Opportunistic cleanup of long-expired rows so the table doesn't grow
    // unbounded with one-off IPs. Fire-and-forget, ~2% of calls.
    if (Math.random() < 0.02) {
      void db
        .execute(
          sql`DELETE FROM rate_limits WHERE expires_at < now() - interval '1 hour'`,
        )
        .catch(() => {})
    }

    return { ok: true, remaining: Math.max(0, limit - count) }
  } catch (err) {
    console.error("[rate-limit] store unavailable, failing open", err)
    return { ok: true, remaining: limit }
  }
}
