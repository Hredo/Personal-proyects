import { getPlayerVideo } from "@/lib/data/videos"
import { HighlightsPlayer } from "./highlights-player"

type Props = {
  playerId: string
  playerName: string
  teamName?: string | null
  leagueName?: string | null
}

export async function HighlightsSection({
  playerId,
  playerName,
  teamName,
  leagueName,
}: Props) {
  const video = await getPlayerVideo(playerId, {
    playerName,
    teamName,
    leagueName,
  })

  if (!video) {
    return (
      <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-6">
        <p className="text-sm text-ink-200">
          No highlight reel found for <strong>{playerName}</strong> on YouTube.
        </p>
        <p className="mt-2 text-xs text-ink-400">
          The search runs automatically the first time you visit a player page.
          {teamName ? (
            <>
              {" "}
              Check that <strong>{teamName}</strong> and the player name are
              spelled correctly.
            </>
          ) : (
            <> Try again later.</>
          )}
        </p>
      </div>
    )
  }

  return <HighlightsPlayer video={video} playerName={playerName} />
}
