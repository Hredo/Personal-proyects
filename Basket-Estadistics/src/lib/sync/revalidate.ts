const DEFAULT_TAGS = [
  "leagues",
  "seasons",
  "teams",
  "players",
  "coaches",
  "team-stats",
  "player-stats",
]

export async function revalidateCacheTags(
  tags: string[] = DEFAULT_TAGS,
): Promise<void> {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.SITE_URL ??
    "http://localhost:3000"
  const secret = process.env.CRON_SECRET
  if (!secret) {
    console.warn(
      "[revalidate] CRON_SECRET is not set; skipping cache invalidation.",
    )
    return
  }
  const url = `${base.replace(/\/$/, "")}/api/revalidate?tags=${encodeURIComponent(
    tags.join(","),
  )}`
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { authorization: `Bearer ${secret}` },
    })
    if (!res.ok) {
      const body = await res.text().catch(() => "")
      console.warn(
        `[revalidate] endpoint returned ${res.status} for ${url} — ${body.slice(0, 200)}`,
      )
      return
    }
    const data = (await res.json().catch(() => null)) as {
      invalidated?: string[]
    } | null
    console.log(
      `[revalidate] invalidated: ${(data?.invalidated ?? tags).join(", ")}`,
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.warn(`[revalidate] failed to call ${url} — ${message}`)
  }
}
