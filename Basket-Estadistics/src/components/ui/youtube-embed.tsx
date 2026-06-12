"use client"

import { useRef, useState, useEffect } from "react"
import { youtubeEmbedUrl, youtubeThumbnail } from "@/lib/highlights/youtube"

type Props = {
  youtubeId: string
  title: string
}

export function YouTubeEmbed({ youtubeId, title }: Props) {
  const [isInView, setIsInView] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    if (typeof IntersectionObserver === "undefined") return

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setIsInView(true)
            io.disconnect()
            return
          }
        }
      },
      { rootMargin: "200px 0px" },
    )

    io.observe(el)
    return () => io.disconnect()
  }, [])

  const showIframe = isInView && hasStarted

  return (
    <div
      ref={containerRef}
      className="relative aspect-video w-full overflow-hidden rounded-xl bg-black"
    >
      {showIframe ? (
        <iframe
          src={`${youtubeEmbedUrl(youtubeId)}?autoplay=1&rel=0`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      ) : (
        <>
          <img
            src={youtubeThumbnail(youtubeId)}
            alt={title}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-black/30" />
          <button
            type="button"
            onClick={() => setHasStarted(true)}
            aria-label={`Play ${title}`}
            className="absolute inset-0 flex items-center justify-center transition duration-200 hover:scale-105"
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-500 text-ink-950 shadow-[var(--shadow-brand-glow)] transition duration-200 hover:bg-brand-400 sm:h-20 sm:w-20">
              <svg
                viewBox="0 0 24 24"
                className="ml-1 h-8 w-8 sm:h-10 sm:w-10"
                fill="currentColor"
                aria-hidden
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
          </button>
        </>
      )}
    </div>
  )
}
