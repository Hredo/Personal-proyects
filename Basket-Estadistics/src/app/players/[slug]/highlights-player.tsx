import { type StoredVideo } from "@/lib/highlights/youtube"
import { YouTubeEmbed } from "@/components/ui/youtube-embed"

type Props = {
  video: StoredVideo
  playerName: string
}

export function HighlightsPlayer({ video, playerName }: Props) {
  // The parent <section> already renders a "Highlights" heading, so this
  // component must NOT add a second "Highlight reel" eyebrow above the embed.
  return (
    <YouTubeEmbed youtubeId={video.youtubeId} title={`${playerName} highlights`} />
  )
}
