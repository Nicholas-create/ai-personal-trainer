import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase/admin';
import { logger } from '@/lib/logger';

export interface AuthResult {
  authenticated: boolean;
  userId?: string;
  error?: string;
}

/**
 * Verify Firebase ID token from Authorization header
 *
 * Expected header format: Authorization: Bearer <idToken>
 *
 * Returns the decoded user ID if valid, or an error response
 */
export async function verifyAuthToken(request: NextRequest): Promise<AuthResult> {
  try {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader?.startsWith('Bearer ')) {
      return {
        authenticated: false,
        error: 'Missing or invalid Authorization header',
      };
    }

    const idToken = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!idToken) {
      return {
        authenticated: false,
        error: 'No token provided',
      };
    }

    // Verify the ID token with Firebase Admin
    const adminAuth = getAdminAuth();
    const decodedToken = await adminAuth.verifyIdToken(idToken);

    return {
      authenticated: true,
      userId: decodedToken.uid,
    };
  } catch (error) {
    logger.error('Token verification failed:', error);

    // Provide specific error messages for common cases
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage.includes('expired')) {
      return {
        authenticated: false,
        error: 'Token expired',
      };
    }

    if (errorMessage.includes('invalid')) {
      return {
        authenticated: false,
        error: 'Invalid token',
      };
    }

    return {
      authenticated: false,
      error: 'Authentication failed',
    };
  }
}

/**
 * Higher-order function to wrap API route handlers with authentication
 *
 * Usage:
 * export const POST = withAuth(async (request, { userId }) => {
 *   // Handler code here - userId is guaranteed to be defined
 * });
 */
export function withAuth(
  handler: (
    request: NextRequest,
    context: { userId: string }
  ) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const authResult = await verifyAuthToken(request);

    if (!authResult.authenticated || !authResult.userId) {
      return NextResponse.json(
        { error: authResult.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    return handler(request, { userId: authResult.userId });
  };
}

/**
 * Create an unauthorized response with consistent format
 */
export function unauthorizedResponse(message = 'Unauthorized'): NextResponse {
  return NextResponse.json({ error: message }, { status: 401 });
}
