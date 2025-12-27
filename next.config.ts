import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  // Externalize packages that shouldn't be bundled (required for Firebase deployment)
  // firebase-admin and related packages must run as external modules in Cloud Functions
  serverExternalPackages: [
    'firebase-admin',
    '@google-cloud/firestore',
    '@google-cloud/storage',
    'google-auth-library',
  ],

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com',
      },
    ],
  },

  // Environment variables that should be available at build time
  env: {
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  },
};

// Sentry configuration options
const sentryWebpackPluginOptions = {
  // Organization and project in Sentry
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Auth token for uploading source maps
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Only upload source maps in production
  silent: process.env.NODE_ENV !== 'production',

  // Hide source maps from the client
  hideSourceMaps: true,

  // Disable source map generation in development
  disableServerWebpackPlugin: process.env.NODE_ENV !== 'production',
  disableClientWebpackPlugin: process.env.NODE_ENV !== 'production',

  // Automatically instrument API routes
  autoInstrumentServerFunctions: true,

  // Tunnel Sentry events through the app to avoid ad blockers
  tunnelRoute: '/monitoring-tunnel',

  // Widens the scope of the SDK to include more files
  widenClientFileUpload: true,

  // Automatically annotate React components
  reactComponentAnnotation: {
    enabled: true,
  },
};

// Export with Sentry wrapper (only if DSN is configured)
export default process.env.NEXT_PUBLIC_SENTRY_DSN
  ? withSentryConfig(nextConfig, sentryWebpackPluginOptions)
  : nextConfig;
