"use client"

import { youtubeThumbnail, youtubeWatchUrl } from "@/lib/highlights/youtube"

type Props = {
  youtubeId: string
  title: string
}

// We deliberately do NOT mount a YouTube <iframe> here. Highlight reels are
// auto-matched from public search results and a large share of them have
// embedding disabled by the uploader. An embedded player for such a video
// renders YouTube's in-player "Error 153 — video player configuration" message,
// a broken dead-end the visitor cannot recover from. Opening the watch page in
// a new tab always works, and mirrors the no-match fallback in highlights.tsx.
export function YouTubeEmbed({ youtubeId, title }: Props) {
  return (
    <a
      href={youtubeWatchUrl(youtubeId)}
      target="_blank"
      rel="noreferrer noopener"
      aria-label={`Watch ${title} on YouTube`}
      className="group relative block aspect-video w-full overflow-hidden rounded-xl bg-black"
    >
      <img
        src={youtubeThumbnail(youtubeId)}
        alt={title}
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-fluid group-hover:scale-[1.03]"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-black/25"
      />
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-500 text-ink-950 shadow-[var(--shadow-brand-glow)] transition duration-200 group-hover:scale-105 group-hover:bg-brand-400 sm:h-20 sm:w-20">
          <svg
            viewBox="0 0 24 24"
            className="ml-1 h-8 w-8 sm:h-10 sm:w-10"
            fill="currentColor"
            aria-hidden
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        </span>
      </span>
      <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-ink-950/70 px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-100 ring-1 ring-hairline backdrop-blur">
        Watch on YouTube ↗
      </span>
    </a>
  )
}
