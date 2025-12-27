import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAdminAuth } from '@/lib/firebase/admin';
import { logger } from '@/lib/logger';
import {
  generateSessionToken,
  createSession,
  getSession,
  deleteSession,
  getSessionTTL,
} from '@/lib/session/firestoreSessionStore';
import { SESSION_COOKIE_NAME } from '@/lib/session/constants';

// POST - Set auth session cookie (HttpOnly, Secure)
// Requires Firebase ID token in Authorization header
export async function POST(request: NextRequest) {
  try {
    // Get Firebase ID token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing Authorization header' },
        { status: 401 }
      );
    }

    const idToken = authHeader.substring(7);
    if (!idToken) {
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 401 }
      );
    }

    // Verify the ID token with Firebase Admin
    const adminAuth = getAdminAuth();
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken);
    } catch (error) {
      logger.error('Failed to verify ID token for session:', error);
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const userId = decodedToken.uid;

    // Generate a unique session token bound to this user
    const sessionToken = generateSessionToken(userId);

    // Store session in Firestore
    const { expiresAt } = await createSession(sessionToken, userId);

    // Set the session cookie
    const cookieStore = await cookies();
    const sessionTTL = getSessionTTL();
    cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: sessionTTL,
    });

    logger.log('Session created for user:', userId);

    return NextResponse.json({ success: true, expiresAt });
  } catch (error) {
    logger.error('Session creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}

// DELETE - Clear auth session cookie and invalidate session
export async function DELETE() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    // Invalidate session in Firestore if it exists
    if (sessionToken) {
      await deleteSession(sessionToken);
    }

    // Clear the cookie
    cookieStore.set(SESSION_COOKIE_NAME, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Session deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete session' },
      { status: 500 }
    );
  }
}

// GET - Validate session and return user info
export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { valid: false, error: 'No session' },
        { status: 401 }
      );
    }

    const session = await getSession(sessionToken);

    if (!session.valid) {
      return NextResponse.json(
        { valid: false, error: 'Invalid or expired session' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      valid: true,
      userId: session.userId,
      expiresAt: session.expiresAt,
    });
  } catch (error) {
    logger.error('Session validation error:', error);
    return NextResponse.json(
      { valid: false, error: 'Validation failed' },
      { status: 500 }
    );
  }
}
