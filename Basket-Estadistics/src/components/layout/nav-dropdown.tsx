"use client"

import Link from "next/link"
import { useState } from "react"

type LeagueOption = { slug: string; name: string }

type Props = {
  label: string
  href: string
  leagues: LeagueOption[]
}

export function NavDropdown({ label, href, leagues }: Props) {
  const [open, setOpen] = useState(false)
  let closeTimer: ReturnType<typeof setTimeout> | null = null

  function handleEnter() {
    if (closeTimer) {
      clearTimeout(closeTimer)
      closeTimer = null
    }
    setOpen(true)
  }

  function handleLeave() {
    if (closeTimer) clearTimeout(closeTimer)
    closeTimer = setTimeout(() => setOpen(false), 120)
  }

  return (
    <div
      className="relative"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onFocus={handleEnter}
      onBlur={handleLeave}
    >
      <Link
        href={href}
        className="flex items-center gap-1 transition hover:text-brand-300"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {label}
        <svg
          aria-hidden
          className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="2"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
        </svg>
      </Link>
      <div
        role="menu"
        className={`absolute left-1/2 top-full z-50 mt-2 w-44 -translate-x-1/2 origin-top rounded-lg border border-white/10 bg-ink-900/95 p-1.5 shadow-[var(--shadow-court)] backdrop-blur transition-all duration-150 ${
          open
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-1 opacity-0"
        }`}
      >
        <p className="px-2.5 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-widest text-ink-400">
          Leagues
        </p>
        <Link
          href={href}
          role="menuitem"
          className="block rounded-md px-2.5 py-1.5 text-xs text-ink-200 transition hover:bg-white/5 hover:text-brand-200"
        >
          All
        </Link>
        {leagues.map((l) => (
          <Link
            key={l.slug}
            href={`${href}?league=${l.slug}`}
            role="menuitem"
            className="block rounded-md px-2.5 py-1.5 text-xs text-ink-200 transition hover:bg-white/5 hover:text-brand-200"
          >
            {l.name}
          </Link>
        ))}
      </div>
    </div>
  )
}
