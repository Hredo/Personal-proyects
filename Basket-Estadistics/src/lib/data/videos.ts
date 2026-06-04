import { desc, eq } from "drizzle-orm"
import { getDb } from "@/lib/db/client"
import { videos } from "@/lib/db/schema"
import { findPlayerHighlight } from "@/lib/highlights/search"
import type { StoredVideo } from "@/lib/highlights/youtube"

export type GetVideoHints = {
  playerName: string
  teamName?: string | null
  leagueName?: string | null
}

export async function getPlayerVideo(
  playerId: string,
  hints: GetVideoHints,
): Promise<StoredVideo | null> {
  const db = getDb()

  const [cached] = await db
    .select({
      youtubeId: videos.youtubeId,
      title: videos.title,
      thumbnailUrl: videos.thumbnailUrl,
    })
    .from(videos)
    .where(eq(videos.playerId, playerId))
    .orderBy(desc(videos.createdAt))
    .limit(1)

  if (cached) {
    return {
      youtubeId: cached.youtubeId,
      title: cached.title,
      thumbnailUrl: cached.thumbnailUrl,
    }
  }

  const found = await findPlayerHighlight({
    playerName: hints.playerName,
    teamName: hints.teamName ?? null,
    leagueName: hints.leagueName ?? null,
  })

  if (!found) return null

  try {
    await db.delete(videos).where(eq(videos.playerId, playerId))
    await db.insert(videos).values({
      playerId,
      youtubeId: found.videoId,
      title: found.title,
      thumbnailUrl: found.thumbnailUrl,
      publishedAt: null,
    })
  } catch (err) {
    console.error("[videos] failed to cache highlight:", err)
  }

  return {
    youtubeId: found.videoId,
    title: found.title,
    thumbnailUrl: found.thumbnailUrl,
  }
}
