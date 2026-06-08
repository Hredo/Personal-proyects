import { youtubeWatchUrl, type StoredVideo } from "@/lib/highlights/youtube"

type Props = {
  video: StoredVideo
  playerName: string
}

export function HighlightsPlayer({ video, playerName }: Props) {
  return (
    <a
      href={youtubeWatchUrl(video.youtubeId)}
      target="_blank"
      rel="noreferrer noopener"
      aria-label={`Watch ${playerName} highlights on YouTube`}
      className="gh-card gh-card-interactive group flex items-center gap-4 p-4 sm:p-5"
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-500 text-ink-950 shadow-[var(--shadow-brand-glow)] transition duration-200 group-hover:scale-105 sm:h-14 sm:w-14">
        <PlayIcon />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-brand-300">
          Highlights
        </p>
        <p className="mt-0.5 text-sm font-semibold text-ink-50 sm:text-base">
          Watch {playerName} highlights on YouTube
        </p>
      </div>
      <span
        aria-hidden
        className="shrink-0 font-mono text-xs font-semibold text-ink-300 transition group-hover:text-brand-200"
      >
        Open ↗
      </span>
    </a>
  )
}

function PlayIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-6 w-6 sm:h-7 sm:w-7"
      fill="currentColor"
      aria-hidden
    >
      <path d="M8 5v14l11-7z" />
    </svg>
  )
}
