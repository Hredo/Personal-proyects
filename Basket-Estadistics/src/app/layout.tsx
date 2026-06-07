import type { Metadata, Viewport } from "next"
import Link from "next/link"
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google"
import { Logo } from "@/components/svg/logo"
import { NavDropdown } from "@/components/layout/nav-dropdown"
import { MobileNav } from "@/components/layout/mobile-nav"
import { Footer } from "@/components/layout/footer"
import { SearchTrigger } from "@/components/players/search-trigger"
import { PlayerCommandPalette } from "@/components/players/player-command-palette"
import { JsonLd } from "@/components/marketing/json-ld"
import { UserMenu } from "@/components/auth/user-menu"
import { SITE, SEO_KEYWORDS } from "@/lib/site"
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
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — ${SITE.tagline}`,
    template: `%s · ${SITE.shortName}`,
  },
  description: SITE.description,
  keywords: SEO_KEYWORDS,
  applicationName: SITE.name,
  authors: [{ name: SITE.author, url: SITE.url }],
  creator: SITE.author,
  publisher: SITE.author,
  alternates: {
    canonical: "/",
  },
  category: "Sports Analytics",
  classification: "Sports, Analytics, Basketball",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE.url,
    siteName: SITE.name,
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
    creator: SITE.twitter,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  icons: {
    icon: [
      { url: "/icon", type: "image/png", sizes: "32x32" },
      { url: "/icon-192", type: "image/png", sizes: "192x192" },
      { url: "/icon-512", type: "image/png", sizes: "512x512" },
    ],
  },
  manifest: "/manifest.webmanifest",
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
        <JsonLd
          data={[
            {
              "@context": "https://schema.org",
              "@type": "Organization",
              name: SITE.name,
              url: SITE.url,
              logo: `${SITE.url}/icon`,
              description: SITE.description,
              sameAs: [],
              contactPoint: [
                {
                  "@type": "ContactPoint",
                  email: SITE.contact,
                  contactType: "customer support",
                  availableLanguage: ["English", "Spanish"],
                },
              ],
            },
            {
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: SITE.name,
              url: SITE.url,
              description: SITE.description,
              inLanguage: SITE.locale,
              potentialAction: {
                "@type": "SearchAction",
                target: `${SITE.url}/players?q={search_term_string}`,
                "query-input": "required name=search_term_string",
              },
            },
          ]}
        />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[200] focus:rounded-md focus:bg-brand-500 focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-ink-950"
        >
          Skip to content
        </a>
        <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-ink-950/70 backdrop-blur-xl supports-[backdrop-filter]:bg-ink-950/55">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-ink-50 sm:gap-3"
              aria-label={`${SITE.name} — Home`}
            >
              <Logo className="h-7 w-7 sm:h-8 sm:w-8" />
              <span className="font-display text-base font-bold tracking-tight sm:text-lg">
                globalhoopstats
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
              <Link
                href="/ai-advisor"
                className="group inline-flex items-center gap-1.5 transition hover:text-brand-300"
              >
                AI Advisor
                <span className="inline-flex items-center gap-1 rounded-full border border-accent-cyan/40 bg-accent-cyan/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-widest text-accent-cyan">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-cyan opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent-cyan" />
                  </span>
                  Pro
                </span>
              </Link>
            </nav>
            <div className="flex items-center gap-2 sm:gap-3">
              <SearchTrigger />
              <UserMenu />
              <Link
                href="/compare"
                className="hidden rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-ink-950 shadow-[var(--shadow-brand-glow)] transition duration-200 hover:bg-brand-400 active:translate-y-px md:inline-flex"
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
        <Footer />
      </body>
    </html>
  )
}
