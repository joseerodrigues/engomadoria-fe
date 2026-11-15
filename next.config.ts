import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Allow phone browsers on a private Wi-Fi network to load dev assets and HMR.
  allowedDevOrigins: ["192.168.*.*"],
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
