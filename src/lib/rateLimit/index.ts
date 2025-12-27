import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import {
  checkRateLimit as checkRateLimitFirestore,
  getRateLimitStatus,
} from './firestoreRateLimitStore';

interface RateLimitConfig {
  /** Maximum number of requests allowed in the window */
  maxRequests: number;
  /** Time window in milliseconds */
  windowMs: number;
  /** Optional message to return when rate limited */
  message?: string;
}

/**
 * Rate limit response helper
 */
export function rateLimitResponse(
  resetAt: number,
  message?: string
): NextResponse {
  const retryAfter = Math.ceil((resetAt - Date.now()) / 1000);

  return NextResponse.json(
    {
      error: message || 'Too many requests. Please try again later.',
      retryAfter,
    },
    {
      status: 429,
      headers: {
        'Retry-After': String(retryAfter),
        'X-RateLimit-Reset': String(resetAt),
      },
    }
  );
}

// Pre-configured rate limiters for different endpoints
export const RATE_LIMITS = {
  // Chat API: 20 requests per minute (AI calls are expensive)
  chat: {
    maxRequests: 20,
    windowMs: 60 * 1000,
    message: 'You are sending messages too quickly. Please wait a moment.',
  },
  // Generate plan: 5 requests per minute (heavy AI operation)
  generatePlan: {
    maxRequests: 5,
    windowMs: 60 * 1000,
    message: 'Plan generation is limited. Please wait before generating another plan.',
  },
  // Onboarding chat: 30 requests per minute
  onboardingChat: {
    maxRequests: 30,
    windowMs: 60 * 1000,
    message: 'Please slow down during onboarding.',
  },
  // General API: 100 requests per minute
  general: {
    maxRequests: 100,
    windowMs: 60 * 1000,
    message: 'Too many requests. Please try again later.',
  },
} as const;

/**
 * Apply rate limiting to a request using Firestore for distributed storage
 * Returns null if allowed, or a Response if rate limited
 */
export async function applyRateLimit(
  userId: string,
  endpoint: keyof typeof RATE_LIMITS
): Promise<NextResponse | null> {
  const config = RATE_LIMITS[endpoint];

  const result = await checkRateLimitFirestore(userId, endpoint, config);

  if (result.isLimited) {
    logger.warn(`Rate limit exceeded for user ${userId} on ${endpoint}`);
    return rateLimitResponse(result.resetAt, config.message);
  }

  return null;
}

/**
 * Get rate limit headers for response
 * Uses Firestore to get current status
 */
export async function getRateLimitHeaders(
  userId: string,
  endpoint: keyof typeof RATE_LIMITS
): Promise<Record<string, string>> {
  const config = RATE_LIMITS[endpoint];

  const status = await getRateLimitStatus(userId, endpoint, config);

  return {
    'X-RateLimit-Limit': String(status.limit),
    'X-RateLimit-Remaining': String(status.remaining),
    'X-RateLimit-Reset': String(status.resetAt),
  };
}

// Re-export the check function for direct use if needed
export { checkRateLimit as checkRateLimitFirestore } from './firestoreRateLimitStore';
