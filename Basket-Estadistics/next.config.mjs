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
        // Security headers for everything we serve. The advisor page is the
        // main consumer of user-controlled text, so it gets the strictest set.
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "no-referrer" },
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains",
          },
        ],
      },
      {
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
