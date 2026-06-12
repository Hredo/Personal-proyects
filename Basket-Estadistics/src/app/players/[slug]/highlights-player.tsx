import { type StoredVideo } from "@/lib/highlights/youtube"
import { YouTubeEmbed } from "@/components/ui/youtube-embed"

type Props = {
  video: StoredVideo
  playerName: string
}

export function HighlightsPlayer({ video, playerName }: Props) {
  return (
    <div className="space-y-3">
      <p className="gh-eyebrow">Highlight reel</p>
      <YouTubeEmbed youtubeId={video.youtubeId} title={`${playerName} highlights`} />
    </div>
  )
}
