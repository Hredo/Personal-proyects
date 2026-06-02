/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: process.cwd(),
  webpack(config) {
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
    });
    return config;
  },
};

export default nextConfig;
