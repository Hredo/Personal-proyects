import type { Metadata, Viewport } from "next"
import { Archivo, Geist, JetBrains_Mono } from "next/font/google"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { LazyCommandPalette } from "@/components/players/lazy-command-palette"
import { JsonLd } from "@/components/marketing/json-ld"
import { SITE, SEO_KEYWORDS } from "@/lib/site"
import "./globals.css"

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-sans-loaded",
  display: "swap",
})

const archivo = Archivo({
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
      data-scroll-behavior="smooth"
      className={`${geist.variable} ${archivo.variable} ${jetbrainsMono.variable}`}
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
        <Navbar />
        <main id="main" className="mx-auto max-w-7xl px-4 sm:px-6">
          {children}
        </main>
        <LazyCommandPalette />
        <Footer />
      </body>
    </html>
  )
}
