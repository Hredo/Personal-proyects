"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

type LeagueOption = { slug: string; name: string }

type Props = {
  leagues: LeagueOption[]
}

const PRIMARY_LINKS = [
  { href: "/players", label: "Players" },
  { href: "/teams", label: "Teams" },
  { href: "/coaches", label: "Coaches" },
  { href: "/compare", label: "Compare" },
  { href: "/leagues", label: "Leagues" },
] as const

export function MobileNav({ leagues }: Props) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = prev
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
        aria-controls="mobile-nav-panel"
        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-hairline bg-white/[0.04] text-ink-200 transition-colors duration-200 hover:border-brand-400/40 hover:text-ink-50 md:hidden"
      >
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="2"
          stroke="currentColor"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5"
          />
        </svg>
      </button>

      <div
        className={`fixed inset-0 z-[90] md:hidden ${
          open ? "pointer-events-auto" : "pointer-events-none"
        }`}
        aria-hidden={!open}
      >
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
          className={`absolute inset-0 bg-ink-950/75 backdrop-blur-md transition-opacity duration-300 ${
            open ? "opacity-100" : "opacity-0"
          }`}
          tabIndex={open ? 0 : -1}
        />
        <aside
          id="mobile-nav-panel"
          role="dialog"
          aria-modal="true"
          aria-label="Site navigation"
          className={`absolute right-0 top-0 flex h-full w-[88%] max-w-sm flex-col overflow-y-auto border-l border-hairline bg-surface-0 shadow-2xl shadow-black/60 transition-transform duration-300 ease-fluid ${
            open ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between hairline-b px-5 py-4">
            <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-300">
              Menu
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-hairline bg-white/5 text-ink-200 transition-colors duration-200 hover:border-brand-400/40 hover:text-ink-50"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18 18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <nav className="flex-1 px-3 py-4">
            <ul className="space-y-1">
              {PRIMARY_LINKS.map((l) => {
                const active =
                  pathname === l.href || pathname.startsWith(`${l.href}/`)
                return (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      aria-current={active ? "page" : undefined}
                      className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-base font-medium transition-colors duration-200 ${
                        active
                          ? "bg-brand-500/10 text-brand-200"
                          : "text-ink-100 hover:bg-white/[0.04] hover:text-ink-50"
                      }`}
                    >
                      {l.label}
                      {active ? (
                        <span className="h-1.5 w-1.5 rounded-full bg-brand-400" />
                      ) : null}
                    </Link>
                  </li>
                )
              })}
            </ul>

            <p className="mt-6 px-3 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-500">
              By league
            </p>
            <ul className="mt-2 space-y-1">
              {leagues.map((lg) => (
                <li key={lg.slug}>
                  <Link
                    href={`/players?league=${lg.slug}`}
                    className="block rounded-xl px-3 py-2 text-sm text-ink-200 transition-colors duration-200 hover:bg-white/[0.04] hover:text-ink-50"
                  >
                    {lg.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="hairline-t px-5 py-4">
            <Link
              href="/compare"
              onClick={() => setOpen(false)}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-brand-500 px-4 py-3 text-center text-sm font-semibold text-ink-950 shadow-[var(--shadow-brand-glow)] transition-colors duration-200 hover:bg-brand-400"
            >
              Open the console
            </Link>
          </div>
        </aside>
      </div>
    </>
  )
}
