import { logger } from '@/lib/logger';

interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
};

/**
 * Calculate exponential backoff delay with jitter
 */
function calculateDelay(attempt: number, baseDelay: number, maxDelay: number): number {
  // Exponential backoff: baseDelay * 2^attempt
  const exponentialDelay = baseDelay * Math.pow(2, attempt);
  // Add jitter (random 0-50% additional delay)
  const jitter = exponentialDelay * Math.random() * 0.5;
  // Cap at maxDelay
  return Math.min(exponentialDelay + jitter, maxDelay);
}

/**
 * Check if error is retryable
 */
function isRetryableError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  const message = error.message.toLowerCase();

  // Network errors
  if (message.includes('network') || message.includes('timeout')) return true;

  // Firestore-specific retryable errors
  if (message.includes('unavailable')) return true;
  if (message.includes('deadline-exceeded')) return true;
  if (message.includes('internal')) return true;
  if (message.includes('resource-exhausted')) return true;
  if (message.includes('aborted')) return true;

  // Firebase error codes
  const firebaseError = error as { code?: string };
  if (firebaseError.code) {
    const retryableCodes = [
      'unavailable',
      'deadline-exceeded',
      'internal',
      'resource-exhausted',
      'aborted',
    ];
    if (retryableCodes.some((code) => firebaseError.code?.includes(code))) {
      return true;
    }
  }

  return false;
}

/**
 * Delay for a specified number of milliseconds
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Wrapper for Firestore operations with retry logic
 *
 * Usage:
 * const result = await withRetry(() => updateDoc(docRef, data));
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { maxRetries, baseDelay, maxDelay } = { ...DEFAULT_OPTIONS, ...options };

  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry if it's not a retryable error
      if (!isRetryableError(error)) {
        throw lastError;
      }

      // Don't retry if we've exhausted attempts
      if (attempt === maxRetries) {
        logger.error(
          `Firestore operation failed after ${maxRetries + 1} attempts:`,
          lastError
        );
        throw lastError;
      }

      // Calculate delay and wait before retrying
      const delayMs = calculateDelay(attempt, baseDelay, maxDelay);
      logger.log(
        `Firestore operation failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${Math.round(delayMs)}ms...`
      );
      await delay(delayMs);
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError || new Error('Unknown error');
}

/**
 * Wrapper type for Firestore operation results with error state
 */
export interface FirestoreResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
}

/**
 * Safe wrapper that returns a result object instead of throwing
 *
 * Usage:
 * const result = await safeFirestoreOp(() => updateDoc(docRef, data));
 * if (!result.success) {
 *   handleError(result.error);
 * }
 */
export async function safeFirestoreOp<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<FirestoreResult<T>> {
  try {
    const data = await withRetry(operation, options);
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}
