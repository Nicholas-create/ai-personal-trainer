import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getAdminApp } from '@/lib/firebase/admin';
import { logger } from '@/lib/logger';

const COLLECTION_NAME = 'rateLimits';

interface RateLimitEntry {
  count: number;
  resetAt: Timestamp;
  updatedAt: Timestamp;
}

// Endpoints that should fail closed (block on error) due to cost/security concerns
const FAIL_CLOSED_ENDPOINTS = ['chat', 'generatePlan', 'onboardingChat'];

/**
 * Get the Firestore instance for rate limit storage
 * Uses the admin app to bypass security rules
 */
function getRateLimitDb() {
  const app = getAdminApp();
  return getFirestore(app);
}

/**
 * Generate a rate limit key from identifier and endpoint
 */
function getRateLimitKey(identifier: string, endpoint: string): string {
  // Replace special characters that aren't allowed in Firestore document IDs
  return `${endpoint}_${identifier}`.replace(/[\/\.]/g, '_');
}

/**
 * Check rate limit for a given identifier and endpoint
 * Returns current count and whether the limit is exceeded
 */
export async function checkRateLimit(
  identifier: string,
  endpoint: string,
  config: { maxRequests: number; windowMs: number }
): Promise<{ isLimited: boolean; remaining: number; resetAt: number; count: number }> {
  const db = getRateLimitDb();
  const key = getRateLimitKey(identifier, endpoint);
  const now = Date.now();

  try {
    const docRef = db.collection(COLLECTION_NAME).doc(key);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      // First request - create new entry
      const resetAt = now + config.windowMs;
      const entry: RateLimitEntry = {
        count: 1,
        resetAt: Timestamp.fromMillis(resetAt),
        updatedAt: Timestamp.fromMillis(now),
      };
      await docRef.set(entry);

      return {
        isLimited: false,
        remaining: config.maxRequests - 1,
        resetAt,
        count: 1,
      };
    }

    const data = docSnap.data() as RateLimitEntry;
    const resetAt = data.resetAt.toMillis();

    // Window has expired - reset counter
    if (resetAt < now) {
      const newResetAt = now + config.windowMs;
      const entry: RateLimitEntry = {
        count: 1,
        resetAt: Timestamp.fromMillis(newResetAt),
        updatedAt: Timestamp.fromMillis(now),
      };
      await docRef.set(entry);

      return {
        isLimited: false,
        remaining: config.maxRequests - 1,
        resetAt: newResetAt,
        count: 1,
      };
    }

    // Increment counter
    const newCount = data.count + 1;
    const entry: RateLimitEntry = {
      count: newCount,
      resetAt: data.resetAt,
      updatedAt: Timestamp.fromMillis(now),
    };
    await docRef.set(entry);

    const isLimited = newCount > config.maxRequests;
    const remaining = Math.max(0, config.maxRequests - newCount);

    return {
      isLimited,
      remaining,
      resetAt,
      count: newCount,
    };
  } catch (error) {
    logger.error('Rate limit check failed:', error);

    // For AI endpoints, fail closed (block request) to prevent abuse during outages
    // For other endpoints, fail open to maintain availability
    if (FAIL_CLOSED_ENDPOINTS.includes(endpoint)) {
      logger.warn(`Blocking request to ${endpoint} due to rate limit check failure`);
      return {
        isLimited: true,
        remaining: 0,
        resetAt: now + 60000, // Retry after 1 minute
        count: config.maxRequests + 1,
      };
    }

    // Non-critical endpoints: allow the request but log it
    return {
      isLimited: false,
      remaining: config.maxRequests,
      resetAt: now + config.windowMs,
      count: 0,
    };
  }
}

/**
 * Get current rate limit status without incrementing
 * Useful for getting headers without affecting the count
 */
export async function getRateLimitStatus(
  identifier: string,
  endpoint: string,
  config: { maxRequests: number; windowMs: number }
): Promise<{ remaining: number; resetAt: number; limit: number }> {
  const db = getRateLimitDb();
  const key = getRateLimitKey(identifier, endpoint);
  const now = Date.now();

  try {
    const docRef = db.collection(COLLECTION_NAME).doc(key);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return {
        remaining: config.maxRequests,
        resetAt: now + config.windowMs,
        limit: config.maxRequests,
      };
    }

    const data = docSnap.data() as RateLimitEntry;
    const resetAt = data.resetAt.toMillis();

    // Window has expired
    if (resetAt < now) {
      return {
        remaining: config.maxRequests,
        resetAt: now + config.windowMs,
        limit: config.maxRequests,
      };
    }

    const remaining = Math.max(0, config.maxRequests - data.count);

    return {
      remaining,
      resetAt,
      limit: config.maxRequests,
    };
  } catch (error) {
    logger.error('Rate limit status check failed:', error);
    return {
      remaining: config.maxRequests,
      resetAt: now + config.windowMs,
      limit: config.maxRequests,
    };
  }
}
