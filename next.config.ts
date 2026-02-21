import withPWAInit from "@ducanh2912/next-pwa";
import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  fallbacks: {
    document: "/offline",
  },
  workboxOptions: {
    skipWaiting: true,
    clientsClaim: true,
  },
});

const nextConfig: NextConfig = {
  // Silence Next.js 16 warning about webpack config without turbopack config
  // (next-pwa injects webpack config for Workbox service worker generation)
  turbopack: {},
};

// Apply PWA wrapper
const pwaConfig = withPWA(nextConfig);

// Only wrap with Sentry when DSN is configured
const finalConfig = process.env.NEXT_PUBLIC_SENTRY_DSN
  ? withSentryConfig(pwaConfig, {
      silent: true,
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      widenClientFileUpload: true,
    })
  : pwaConfig;

export default finalConfig;
