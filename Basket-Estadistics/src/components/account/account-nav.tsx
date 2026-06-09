"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/components/ui/cn"

type Item = {
  href: string
  label: string
  icon: React.ReactNode
}

function Icon({ d }: { d: string }) {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d={d} />
    </svg>
  )
}

const ITEMS: Item[] = [
  {
    href: "/account",
    label: "Profile",
    icon: <Icon d="M12 12a4 4 0 100-8 4 4 0 000 8zM4 20c0-3.3 3.6-6 8-6s8 2.7 8 6" />,
  },
  {
    href: "/account/ai-keys",
    label: "AI & keys",
    icon: (
      <Icon d="M14 7a4 4 0 11-3.8 5.2L4 18v3h3v-2h2v-2h2l1.2-1.2A4 4 0 0114 7zm2.5 2.5h.01" />
    ),
  },
  {
    href: "/account/subscription",
    label: "Subscription",
    icon: <Icon d="M3 7h18M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7M3 7l2-3h14l2 3M7 14h4" />,
  },
  {
    href: "/account/security",
    label: "Security",
    icon: <Icon d="M12 3l7 3v6c0 4.4-3 7.6-7 9-4-1.4-7-4.6-7-9V6l7-3zM9.5 12l1.8 1.8L15 10" />,
  },
  {
    href: "/account/preferences",
    label: "Preferences",
    icon: (
      <Icon d="M10.3 4.3a1 1 0 011.4 0l.7.7a8 8 0 011.6.7l1-.2a1 1 0 011 .5l.7 1.2a1 1 0 01-.2 1.2l-.7.7c.1.5.1 1 0 1.6l.7.7a1 1 0 01.2 1.2l-.7 1.2a1 1 0 01-1 .5l-1-.2a8 8 0 01-1.6.9l-.2 1a1 1 0 01-1 .8h-1.4a1 1 0 01-1-.8l-.2-1a8 8 0 01-1.6-.9l-1 .2a1 1 0 01-1-.5l-.7-1.2a1 1 0 01.2-1.2l.7-.7a8 8 0 010-1.6l-.7-.7a1 1 0 01-.2-1.2L5 7.9a1 1 0 011-.5l1 .2a8 8 0 011.6-.9zM12 10.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" />
    ),
  },
]

function isActive(pathname: string, href: string): boolean {
  if (href === "/account") return pathname === "/account"
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function AccountNav() {
  const pathname = usePathname()
  return (
    <nav
      aria-label="Account sections"
      className="flex gap-1.5 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0"
    >
      {ITEMS.map((item) => {
        const active = isActive(pathname, item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-sm font-medium transition-all duration-200 lg:w-full",
              active
                ? "border-brand-500/40 bg-brand-500/10 text-brand-100"
                : "border-transparent text-ink-300 hover:bg-white/[0.04] hover:text-ink-50",
            )}
          >
            <span className={active ? "text-brand-300" : "text-ink-500"}>
              {item.icon}
            </span>
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
