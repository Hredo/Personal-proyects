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
        className="flex items-center gap-1 transition-colors duration-200 hover:text-ink-50"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {label}
        <svg
          aria-hidden
          className={`h-3 w-3 transition-transform duration-300 ease-fluid ${open ? "rotate-180" : ""}`}
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
        className={`absolute left-1/2 top-full z-50 mt-3 w-48 -translate-x-1/2 origin-top rounded-xl border border-hairline bg-surface-2/95 p-1.5 shadow-[var(--shadow-court)] backdrop-blur-xl transition-all duration-300 ease-fluid ${
          open
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-1.5 opacity-0"
        }`}
      >
        <p className="px-2.5 pb-1.5 pt-1 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-500">
          By league
        </p>
        <Link
          href={href}
          role="menuitem"
          className="block rounded-lg px-2.5 py-2 text-[13px] font-medium text-ink-200 transition-colors duration-200 hover:bg-white/[0.05] hover:text-ink-50"
        >
          All leagues
        </Link>
        {leagues.map((l) => (
          <Link
            key={l.slug}
            href={`${href}?league=${l.slug}`}
            role="menuitem"
            className="block rounded-lg px-2.5 py-2 text-[13px] font-medium text-ink-200 transition-colors duration-200 hover:bg-white/[0.05] hover:text-ink-50"
          >
            {l.name}
          </Link>
        ))}
      </div>
    </div>
  )
}
