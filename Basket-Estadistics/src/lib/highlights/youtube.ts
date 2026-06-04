const VIDEO_ID_RE = /^[A-Za-z0-9_-]{11}$/

export type YouTubeCandidate = {
  videoId: string
  title: string
  snippet: string
}

export type Highlight = {
  videoId: string
  title: string
  thumbnailUrl: string
  source: string
}

export type StoredVideo = {
  youtubeId: string
  title: string
  thumbnailUrl: string
}

export function extractYouTubeId(url: string): string | null {
  try {
    const u = new URL(url)

    if (u.hostname === "youtu.be") {
      const id = u.pathname.slice(1).split("/")[0]
      return VIDEO_ID_RE.test(id) ? id : null
    }

    if (
      u.hostname === "www.youtube.com" ||
      u.hostname === "youtube.com" ||
      u.hostname === "m.youtube.com" ||
      u.hostname === "www.youtube-nocookie.com"
    ) {
      if (u.pathname === "/watch") {
        const id = u.searchParams.get("v")
        return id && VIDEO_ID_RE.test(id) ? id : null
      }
      const m = u.pathname.match(
        /^\/(?:embed|shorts|v|live)\/([A-Za-z0-9_-]{11})/,
      )
      if (m) return m[1]
    }
  } catch {
    return null
  }
  return null
}

export function youtubeThumbnail(id: string): string {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`
}

export function youtubeEmbedUrl(id: string): string {
  return `https://www.youtube-nocookie.com/embed/${id}`
}

export function youtubeWatchUrl(id: string): string {
  return `https://www.youtube.com/watch?v=${id}`
}
