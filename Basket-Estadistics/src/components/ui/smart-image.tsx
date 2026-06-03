"use client"

import { useEffect, useState } from "react"

type Props = {
  src: string | null | undefined
  alt: string
  fallback: React.ReactNode
  className?: string
  fallbackClassName?: string
  fit?: "cover" | "contain"
  eager?: boolean
  referrerPolicy?: React.HTMLAttributeReferrerPolicy
}

export function SmartImage({
  src,
  alt,
  fallback,
  className = "",
  fallbackClassName = "",
  fit = "cover",
  eager = false,
  referrerPolicy = "no-referrer",
}: Props) {
  const [errored, setErrored] = useState(false)

  useEffect(() => {
    setErrored(false)
  }, [src])

  if (!src || errored) {
    return (
      <div
        className={`flex h-full w-full items-center justify-center ${fallbackClassName}`}
        aria-label={alt}
      >
        {fallback}
      </div>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      referrerPolicy={referrerPolicy}
      onError={() => setErrored(true)}
      className={`h-full w-full object-${fit} ${className}`}
    />
  )
}
