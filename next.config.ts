import type { NextConfig } from "next";

// When this calculator is proxied through another domain (e.g. jrdata.solutions/sfi26-calculator
// via a Next.js rewrite), static assets must load from the canonical Vercel URL — otherwise the
// browser requests them from the proxying host and they 404. Only set in production so dev HMR works.
const ASSET_PREFIX = "https://sfi26-calculator.vercel.app";

const nextConfig: NextConfig = {
  assetPrefix: process.env.NODE_ENV === "production" ? ASSET_PREFIX : undefined,
};

export default nextConfig;
