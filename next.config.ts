import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Hide Turbopack “Compiling…” / route HUD (dev-only; confuses real users)
  // https://nextjs.org/docs/app/api-reference/config/next-config-js/devIndicators
  devIndicators: false,
  onDemandEntries: {
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: 4,
  },
};

export default nextConfig;
