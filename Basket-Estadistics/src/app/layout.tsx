import type { Metadata } from "next"
import Link from "next/link"
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google"
import { Logo } from "@/components/svg/logo"
import { NavDropdown } from "@/components/layout/nav-dropdown"
import { SearchTrigger } from "@/components/players/search-trigger"
import { PlayerCommandPalette } from "@/components/players/player-command-palette"
import "./globals.css"

const NAV_LEAGUES = [
  { slug: "nba", name: "NBA" },
  { slug: "euroleague", name: "EuroLeague" },
  { slug: "acb", name: "ACB" },
]

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans-loaded",
  display: "swap",
})

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display-loaded",
  display: "swap",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono-loaded",
  display: "swap",
})

export const metadata: Metadata = {
  title: {
    default: "Basket Estadistics",
    template: "%s · Basket Estadistics",
  },
  description:
    "Global basketball scouting intelligence. Stats, comparisons and highlights from the NBA, ACB and EuroLeague in one place.",
  applicationName: "Basket Estadistics",
  authors: [{ name: "Hugo Redondo Valdés" }],
  openGraph: {
    title: "Basket Estadistics",
    description:
      "Global basketball scouting intelligence. Stats, comparisons and highlights from the NBA, ACB and EuroLeague in one place.",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}
    >
      <body className="font-sans" suppressHydrationWarning>
        <header className="sticky top-0 z-40 border-b border-white/5 bg-ink-950/60 backdrop-blur supports-[backdrop-filter]:bg-ink-950/40">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <Link href="/" className="flex items-center gap-3 text-ink-50">
              <Logo className="h-8 w-8" />
              <span className="font-display text-lg font-bold tracking-tight">
                Basket<span className="text-brand-400">·</span>Estadistics
              </span>
            </Link>
            <nav className="hidden items-center gap-8 text-sm text-ink-200 md:flex">
              <NavDropdown
                label="Players"
                href="/players"
                leagues={NAV_LEAGUES}
              />
              <NavDropdown label="Teams" href="/teams" leagues={NAV_LEAGUES} />
              <Link href="/coaches" className="transition hover:text-brand-300">
                Coaches
              </Link>
              <Link href="/compare" className="transition hover:text-brand-300">
                Compare
              </Link>
              <Link href="/leagues" className="transition hover:text-brand-300">
                Leagues
              </Link>
            </nav>
            <div className="flex items-center gap-3">
              <SearchTrigger />
              <a
                href="#waitlist"
                className="rounded-md bg-brand-500 px-4 py-2 text-sm font-semibold text-ink-950 shadow-[var(--shadow-brand-glow)] transition hover:bg-brand-400"
              >
                Request access
              </a>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-6">{children}</main>
        <PlayerCommandPalette />
        <footer className="mt-24 border-t border-white/5">
          <div className="mx-auto flex max-w-7xl flex-col gap-2 px-6 py-8 text-sm text-ink-300 sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} Basket Estadistics</p>
            <p className="text-ink-400">
              Data sourced from public APIs. For scouting enquiries contact{" "}
              <a
                href="mailto:Hrvaldes22@gmail.com"
                className="text-brand-300 transition hover:text-brand-200"
              >
                Hrvaldes22@gmail.com
              </a>
            </p>
          </div>
        </footer>
      </body>
    </html>
  )
}
