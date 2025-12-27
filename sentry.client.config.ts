import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Session Replay (optional - captures user sessions)
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // Only enable in production
  enabled: process.env.NODE_ENV === 'production',

  // Set environment
  environment: process.env.NODE_ENV,

  // Filter out sensitive data
  beforeSend(event) {
    // Remove any sensitive user data
    if (event.user) {
      delete event.user.email;
      delete event.user.ip_address;
    }

    // Filter out auth-related breadcrumbs
    if (event.breadcrumbs) {
      event.breadcrumbs = event.breadcrumbs.filter(
        (breadcrumb) => !breadcrumb.message?.includes('token')
      );
    }

    return event;
  },

  // Ignore common non-critical errors
  ignoreErrors: [
    // Network errors that are expected
    'ResizeObserver loop limit exceeded',
    'ResizeObserver loop completed with undelivered notifications',
    'Non-Error exception captured',
    // Firebase auth errors that are user-facing
    'Firebase: Error (auth/popup-closed-by-user)',
    'Firebase: Error (auth/cancelled-popup-request)',
  ],

  // Additional integrations
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
});
