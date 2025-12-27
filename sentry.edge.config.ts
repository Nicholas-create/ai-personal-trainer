import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Only enable in production
  enabled: process.env.NODE_ENV === 'production',

  // Set environment
  environment: process.env.NODE_ENV,

  // Filter out sensitive data from edge function errors
  beforeSend(event) {
    // Remove any sensitive user data
    if (event.user) {
      delete event.user.email;
      delete event.user.ip_address;
    }

    // Remove sensitive headers
    if (event.request?.headers) {
      delete event.request.headers['authorization'];
      delete event.request.headers['cookie'];
    }

    // Filter out auth-related breadcrumbs
    if (event.breadcrumbs) {
      event.breadcrumbs = event.breadcrumbs.filter(
        (breadcrumb) =>
          !breadcrumb.message?.includes('token') &&
          !breadcrumb.message?.includes('secret')
      );
    }

    return event;
  },

  // Ignore expected errors
  ignoreErrors: [
    // Rate limiting is expected
    'Too many requests',
    // Token expiration is expected
    'Token expired',
  ],
});
