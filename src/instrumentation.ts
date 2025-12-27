/**
 * Instrumentation file for Next.js
 * This file runs once when the server starts
 *
 * NOTE: Sentry initialization is disabled for Firebase Cloud Functions
 * due to bundling issues with require-in-the-middle.
 * To enable Sentry, configure NEXT_PUBLIC_SENTRY_DSN and use
 * a different deployment target (e.g., Vercel).
 */

export async function register() {
  // Sentry disabled for Firebase compatibility
  // The @sentry/nextjs package uses require-in-the-middle which
  // doesn't bundle correctly with Firebase Cloud Functions + Turbopack

  // if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  //   if (process.env.NEXT_RUNTIME === 'nodejs') {
  //     await import('../sentry.server.config');
  //   }
  //   if (process.env.NEXT_RUNTIME === 'edge') {
  //     await import('../sentry.edge.config');
  //   }
  // }
}
