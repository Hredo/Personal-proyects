"use client"

import { useState } from "react"
import { SmartImage } from "@/components/ui/smart-image"
import {
  youtubeEmbedUrl,
  youtubeWatchUrl,
  type StoredVideo,
} from "@/lib/highlights/youtube"

type Props = {
  video: StoredVideo
  playerName: string
}

export function HighlightsPlayer({ video, playerName }: Props) {
  const [playing, setPlaying] = useState(false)

  if (playing) {
    return (
      <div className="overflow-hidden rounded-xl border border-white/5 bg-white/[0.02]">
        <div className="relative aspect-video w-full">
          <iframe
            src={`${youtubeEmbedUrl(video.youtubeId)}?autoplay=1&rel=0`}
            title={`${playerName} highlights`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
          />
        </div>
        <div className="flex items-center justify-between gap-3 px-4 py-3 text-xs">
          <p className="truncate text-ink-300" title={video.title}>
            {video.title}
          </p>
          <a
            href={youtubeWatchUrl(video.youtubeId)}
            target="_blank"
            rel="noreferrer noopener"
            className="shrink-0 font-semibold text-brand-300 transition hover:text-brand-200"
          >
            Open on YouTube ↗
          </a>
        </div>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      aria-label={`Play ${playerName} highlight video`}
      className="group relative block aspect-video w-full overflow-hidden rounded-xl border border-white/5 bg-court-900 text-left ring-1 ring-transparent transition duration-150 hover:ring-brand-500/50"
    >
      <SmartImage
        src={video.thumbnailUrl}
        alt={video.title}
        fit="cover"
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        fallbackClassName="bg-gradient-to-br from-court-800 to-ink-900"
        fallback={playerName}
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/30 to-transparent transition group-hover:via-ink-950/40"
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-500 text-ink-950 shadow-[var(--shadow-brand-glow)] transition group-hover:scale-110 sm:h-20 sm:w-20">
          <PlayIcon />
        </span>
      </div>
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-brand-300">
            Highlights
          </p>
          <p className="mt-0.5 truncate text-sm font-semibold text-ink-50 sm:text-base">
            {video.title}
          </p>
        </div>
        <a
          href={youtubeWatchUrl(video.youtubeId)}
          target="_blank"
          rel="noreferrer noopener"
          onClick={(e) => e.stopPropagation()}
          className="hidden shrink-0 rounded-md border border-white/10 bg-ink-950/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-ink-200 backdrop-blur transition hover:border-brand-500/40 hover:text-brand-200 sm:inline-block"
        >
          Open ↗
        </a>
      </div>
    </button>
  )
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7 sm:h-8 sm:w-8" fill="currentColor" aria-hidden>
      <path d="M8 5v14l11-7z" />
    </svg>
  )
}
