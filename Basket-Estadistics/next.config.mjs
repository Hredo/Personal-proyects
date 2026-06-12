/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: process.cwd(),
  onDemandEntries: {
    maxInactiveAge: 1000 * 60 * 60,
    pagesBufferLength: 8,
  },
  async headers() {
    return [
      {
        // Global security headers for all routes
        source: "/:path*",
        headers: [
          // Prevent MIME-type sniffing
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Disallow framing the site
          { key: "X-Frame-Options", value: "DENY" },
          // No referrer information on navigation
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Restrict browser features
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
          // Enforce HTTPS for 2 years
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains",
          },
          // Cross-origin isolation (COEP=unsafe-none because the site
          // loads external images/logos/thumbnails that don't set CORP)
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "unsafe-none",
          },
          {
            key: "Cross-Origin-Resource-Policy",
            value: "same-origin",
          },
          // Disable DNS prefetching (privacy)
          { key: "X-DNS-Prefetch-Control", value: "off" },
          // Opt out of XSS filter (redundant with CSP)
          { key: "X-XSS-Protection", value: "0" },
          // Base CSP: relaxed for general pages
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https: blob:",
              "font-src 'self' data:",
              "connect-src 'self' https:",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
      {
        // Stricter CSP for the AI advisor (user-supplied content)
        source: "/ai-advisor/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self' data:",
              "connect-src 'self' http://localhost:11434 http://127.0.0.1:11434",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
    ]
  },
  webpack(config, { dev }) {
    config.module.rules.push({
      test: /\.svg$/i,
      issuer: /\.[jt]sx?$/,
      use: [
        {
          loader: "@svgr/webpack",
          options: {
            svgo: true,
            titleProp: true,
            ref: true,
          },
        },
      ],
    })

    if (dev) {
      config.watchOptions = {
        ...(config.watchOptions ?? {}),
        poll: 300,
        aggregateTimeout: 150,
        ignored: [
          "**/node_modules/**",
          "**/.git/**",
          "**/.next/**",
          "**/dist/**",
          "**/out/**",
          "**/data/**",
          "**/drizzle/**",
          "**/public/**",
          "**/*.log",
          "**/*.tsbuildinfo",
          "**/*.db",
          "**/*.db-journal",
          "**/*.db-wal",
          "**/*.db-shm",
          "**/.DS_Store",
          "**/Thumbs.db",
          "**/desktop.ini",
        ],
      }
    }

    return config
  },
}

export default nextConfig
