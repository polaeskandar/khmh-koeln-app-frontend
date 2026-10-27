import type { NextConfig } from "next";

/**
 * A static export to out/. The same files are hosted for browsers and bundled into the iOS and
 * Android apps by Capacitor (see capacitor.config.ts), so there is no Next.js server in production:
 * no server actions, cookies() or headers(), no rewrites, redirects or proxy, and no image
 * optimization. Dynamic routes need generateStaticParams. Data comes from the Symfony API.
 */
const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
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
