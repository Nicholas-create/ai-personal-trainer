import * as Sentry from '@sentry/nextjs';

/**
 * Capture an error to Sentry with additional context
 */
export function captureError(
  error: Error | unknown,
  context?: {
    userId?: string;
    action?: string;
    extra?: Record<string, unknown>;
  }
): void {
  if (process.env.NODE_ENV !== 'production') {
    // In development, just log to console
    console.error('[Sentry would capture]:', error, context);
    return;
  }

  Sentry.withScope((scope) => {
    if (context?.userId) {
      scope.setUser({ id: context.userId });
    }

    if (context?.action) {
      scope.setTag('action', context.action);
    }

    if (context?.extra) {
      Object.entries(context.extra).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }

    if (error instanceof Error) {
      Sentry.captureException(error);
    } else {
      Sentry.captureMessage(String(error), 'error');
    }
  });
}

/**
 * Capture a message to Sentry (for non-error events)
 */
export function captureMessage(
  message: string,
  level: 'info' | 'warning' | 'error' = 'info',
  context?: {
    userId?: string;
    extra?: Record<string, unknown>;
  }
): void {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[Sentry ${level}]:`, message, context);
    return;
  }

  Sentry.withScope((scope) => {
    if (context?.userId) {
      scope.setUser({ id: context.userId });
    }

    if (context?.extra) {
      Object.entries(context.extra).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }

    Sentry.captureMessage(message, level);
  });
}

/**
 * Set the current user for Sentry context
 */
export function setUser(userId: string | null): void {
  if (userId) {
    Sentry.setUser({ id: userId });
  } else {
    Sentry.setUser(null);
  }
}

/**
 * Add a breadcrumb to the Sentry trail
 */
export function addBreadcrumb(
  message: string,
  category: string,
  data?: Record<string, unknown>
): void {
  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: 'info',
    timestamp: Date.now() / 1000,
  });
}

/**
 * Start a performance transaction
 */
export function startTransaction(
  name: string,
  operation: string
): Sentry.Span | undefined {
  return Sentry.startInactiveSpan({
    name,
    op: operation,
  });
}

/**
 * Wrap an async function with Sentry error handling
 */
export async function withSentry<T>(
  operation: string,
  fn: () => Promise<T>,
  context?: { userId?: string; extra?: Record<string, unknown> }
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    captureError(error, {
      ...context,
      action: operation,
    });
    throw error;
  }
}
