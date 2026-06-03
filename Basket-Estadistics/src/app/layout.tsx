import type { Metadata, Viewport } from "next"
import Link from "next/link"
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google"
import { Logo } from "@/components/svg/logo"
import { NavDropdown } from "@/components/layout/nav-dropdown"
import { MobileNav } from "@/components/layout/mobile-nav"
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
  formatDetection: {
    telephone: false,
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
    { media: "(prefers-color-scheme: light)", color: "#0a0a0a" },
  ],
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
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[200] focus:rounded-md focus:bg-brand-500 focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-ink-950"
        >
          Skip to content
        </a>
        <header className="sticky top-0 z-40 border-b border-white/5 bg-ink-950/80 backdrop-blur supports-[backdrop-filter]:bg-ink-950/50">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-ink-50 sm:gap-3"
              aria-label="Basket Estadistics — Home"
            >
              <Logo className="h-7 w-7 sm:h-8 sm:w-8" />
              <span className="font-display text-base font-bold tracking-tight sm:text-lg">
                Basket<span className="text-brand-400">·</span>Estadistics
              </span>
            </Link>
             <nav
               className="hidden items-center gap-6 text-sm text-ink-200 md:flex lg:gap-8"
               aria-label="Primary"
             >
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
               <Link href="/ai-advisor" className="transition hover:text-brand-300">
                 AI Advisor
               </Link>
             </nav>
            <div className="flex items-center gap-2 sm:gap-3">
              <SearchTrigger />
              <Link
                href="/compare"
                className="hidden rounded-md bg-brand-500 px-4 py-2 text-sm font-semibold text-ink-950 shadow-[var(--shadow-brand-glow)] transition hover:bg-brand-400 md:inline-flex"
              >
                Open console
              </Link>
              <MobileNav leagues={NAV_LEAGUES} />
            </div>
          </div>
        </header>
        <main id="main" className="mx-auto max-w-7xl px-4 sm:px-6">
          {children}
        </main>
        <PlayerCommandPalette />
        <footer className="mt-16 border-t border-white/5 sm:mt-24">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 text-sm text-ink-300 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-8">
            <p>© {new Date().getFullYear()} Basket Estadistics</p>
            <div className="flex flex-wrap items-center gap-4 sm:gap-5">
              <Link
                href="/players"
                className="transition hover:text-brand-300"
              >
                Players
              </Link>
              <Link
                href="/teams"
                className="transition hover:text-brand-300"
              >
                Teams
              </Link>
              <Link
                href="/compare"
                className="transition hover:text-brand-300"
              >
                Compare
              </Link>
              <a
                href="mailto:Hrvaldes22@gmail.com"
                className="transition hover:text-brand-300"
              >
                Contact
              </a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
