"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import {
  LayoutGroup,
  motion,
  useScroll,
  useSpring,
} from "framer-motion"
import { Logo } from "@/components/svg/logo"
import { SearchTrigger } from "@/components/players/search-trigger"
import { UserMenu } from "@/components/auth/user-menu"
import { MobileNav } from "@/components/layout/mobile-nav"
import { SITE } from "@/lib/site"
import { cn } from "@/components/ui/cn"
import { LEAGUE_FILTER_TREE } from "@/lib/league-groups"

const LINKS: {
  href: string
  label: string
  leagues?: boolean
  pro?: boolean
}[] = [
  { href: "/players", label: "Players", leagues: true },
  { href: "/teams", label: "Teams", leagues: true },
  { href: "/coaches", label: "Coaches" },
  { href: "/compare", label: "Compare" },
  { href: "/leagues", label: "Leagues" },
  { href: "/ai-advisor", label: "AI Advisor", pro: true },
]

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function Navbar() {
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)

  const { scrollYProgress } = useScroll()
  const progress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    mass: 0.3,
  })

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <header className="sticky top-0 z-50">
      {/* scroll progress hairline */}
      <motion.div
        aria-hidden
        style={{ scaleX: progress }}
        className="absolute inset-x-0 top-0 z-10 h-px origin-left bg-gradient-to-r from-brand-500 via-ember-400 to-brand-600"
      />
      <div className="mx-auto max-w-7xl px-3 sm:px-6">
        <div
          className={cn(
            "mt-2 flex items-center justify-between gap-3 rounded-full px-3 transition-all duration-500 ease-fluid sm:mt-3 sm:px-4",
            scrolled
              ? "gh-glass py-1.5 shadow-[var(--shadow-court)]"
              : "border border-transparent py-2.5",
          )}
        >
          <Link
            href="/"
            className="group flex shrink-0 items-center gap-2.5 text-ink-50"
            aria-label={`${SITE.name} — Home`}
          >
            <Logo className="h-7 w-7 transition-transform duration-700 ease-spring group-hover:rotate-[18deg] sm:h-8 sm:w-8" />
            <span className="font-display text-[15px] font-bold tracking-[-0.02em] sm:text-base">
              globalhoopstats<span className="text-brand-500">.</span>
            </span>
          </Link>

          <nav
            className="hidden items-center md:flex"
            aria-label="Primary"
          >
            <LayoutGroup id="nav">
              <ul className="flex items-center gap-0.5 text-sm font-medium text-ink-300">
                {LINKS.map((l) => (
                  <NavItem
                    key={l.href}
                    href={l.href}
                    label={l.label}
                    pro={l.pro}
                    active={isActive(pathname, l.href)}
                    withLeagues={l.leagues}
                  />
                ))}
              </ul>
            </LayoutGroup>
          </nav>

          <div className="flex items-center gap-2 sm:gap-2.5">
            <SearchTrigger />
            <UserMenu />
            <MobileNav />
          </div>
        </div>
      </div>
    </header>
  )
}

function NavItem({
  href,
  label,
  active,
  pro,
  withLeagues,
}: {
  href: string
  label: string
  active: boolean
  pro?: boolean
  withLeagues?: boolean
}) {
  const [open, setOpen] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function enter() {
    if (timer.current) clearTimeout(timer.current)
    setOpen(true)
  }
  function leave() {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setOpen(false), 120)
  }

  return (
    <li
      className="relative"
      onMouseEnter={withLeagues ? enter : undefined}
      onMouseLeave={withLeagues ? leave : undefined}
      onFocus={withLeagues ? enter : undefined}
      onBlur={withLeagues ? leave : undefined}
    >
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        aria-haspopup={withLeagues ? "menu" : undefined}
        aria-expanded={withLeagues ? open : undefined}
        className={cn(
          "relative flex items-center gap-1.5 rounded-full px-3.5 py-2 transition-colors duration-300 lg:px-4",
          active ? "text-ink-50" : "hover:text-ink-50",
        )}
      >
        {active && (
          <motion.span
            layoutId="navPill"
            aria-hidden
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            className="absolute inset-0 -z-10 rounded-full bg-white/[0.07] ring-1 ring-hairline"
          />
        )}
        {label}
        {pro && (
          <span className="rounded-full border border-brand-500/40 bg-brand-500/10 px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-brand-300">
            Pro
          </span>
        )}
        {withLeagues && (
          <svg
            aria-hidden
            className={cn(
              "h-3 w-3 transition-transform duration-300 ease-fluid",
              open && "rotate-180",
            )}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
          </svg>
        )}
      </Link>

      {withLeagues && (
        <div
          role="menu"
          className={cn(
            "absolute left-1/2 top-full z-50 mt-2 w-56 -translate-x-1/2 origin-top rounded-2xl border border-hairline bg-surface-2/95 p-1.5 shadow-[var(--shadow-court)] backdrop-blur-xl transition-all duration-300 ease-fluid",
            open
              ? "pointer-events-auto translate-y-0 opacity-100"
              : "pointer-events-none -translate-y-1.5 opacity-0",
          )}
        >
          <p className="px-2.5 pb-1.5 pt-1 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-500">
            By league
          </p>
          <Link
            href={href}
            role="menuitem"
            className="block rounded-xl px-2.5 py-2 text-[13px] font-medium text-ink-200 transition-colors duration-200 hover:bg-white/[0.05] hover:text-ink-50"
          >
            All leagues
          </Link>
          {LEAGUE_FILTER_TREE.map((node) => (
            <div key={node.slug}>
              <Link
                href={`${href}?league=${node.slug}`}
                role="menuitem"
                className="flex items-center gap-2 rounded-xl px-2.5 py-2 text-[13px] font-medium text-ink-200 transition-colors duration-200 hover:bg-white/[0.05] hover:text-ink-50"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-brand-500/70" />
                {node.label}
              </Link>
              {node.children?.map((child) => (
                <Link
                  key={child.slug}
                  href={`${href}?league=${child.slug}`}
                  role="menuitem"
                  className="flex items-center gap-2 rounded-xl py-1.5 pl-7 pr-2.5 text-[12px] font-medium text-ink-300 transition-colors duration-200 hover:bg-white/[0.05] hover:text-ink-50"
                >
                  <span className="h-1 w-1 rounded-full bg-brand-500/50" />
                  {child.label}
                </Link>
              ))}
            </div>
          ))}
        </div>
      )}
    </li>
  )
}
