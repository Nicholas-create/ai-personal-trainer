import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getAdminApp } from '@/lib/firebase/admin';
import { logger } from '@/lib/logger';
import crypto from 'crypto';

const COLLECTION_NAME = 'sessions';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 5; // 5 days

interface SessionData {
  userId: string;
  createdAt: Timestamp;
  expiresAt: Timestamp;
  tokenHash: string;
}

/**
 * Get the Firestore instance for session storage
 * Uses the admin app to bypass security rules
 */
function getSessionDb() {
  const app = getAdminApp();
  return getFirestore(app);
}

/**
 * Generate a secure session token
 * Note: userId parameter kept for API compatibility but not included in token
 * The user binding is maintained server-side in the session store
 */
export function generateSessionToken(_userId: string): string {
  const randomBytes = crypto.randomBytes(32).toString('hex');
  const timestamp = Date.now().toString(36);
  // Use only random bytes and timestamp - no user-identifiable information
  return `sess_${timestamp}_${randomBytes}`;
}

/**
 * Hash a session token for storage lookup
 */
export function hashSessionToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Create a new session in Firestore
 */
export async function createSession(
  sessionToken: string,
  userId: string
): Promise<{ expiresAt: number }> {
  const db = getSessionDb();
  const tokenHash = hashSessionToken(sessionToken);
  const now = Date.now();
  const expiresAt = now + SESSION_TTL_SECONDS * 1000;

  const sessionData: SessionData = {
    userId,
    createdAt: Timestamp.fromMillis(now),
    expiresAt: Timestamp.fromMillis(expiresAt),
    tokenHash,
  };

  try {
    await db.collection(COLLECTION_NAME).doc(tokenHash).set(sessionData);
    logger.log('Session created in Firestore for user:', userId);
    return { expiresAt };
  } catch (error) {
    logger.error('Failed to create session in Firestore:', error);
    throw error;
  }
}

/**
 * Get a session from Firestore
 */
export async function getSession(
  sessionToken: string
): Promise<{ valid: boolean; userId?: string; expiresAt?: number }> {
  const db = getSessionDb();
  const tokenHash = hashSessionToken(sessionToken);

  try {
    const docSnap = await db.collection(COLLECTION_NAME).doc(tokenHash).get();

    if (!docSnap.exists) {
      return { valid: false };
    }

    const data = docSnap.data() as SessionData;
    const expiresAt = data.expiresAt.toMillis();

    // Check if session has expired
    if (expiresAt < Date.now()) {
      // Clean up expired session
      await deleteSession(sessionToken);
      return { valid: false };
    }

    return {
      valid: true,
      userId: data.userId,
      expiresAt,
    };
  } catch (error) {
    logger.error('Failed to get session from Firestore:', error);
    return { valid: false };
  }
}

/**
 * Delete a session from Firestore
 */
export async function deleteSession(sessionToken: string): Promise<void> {
  const db = getSessionDb();
  const tokenHash = hashSessionToken(sessionToken);

  try {
    await db.collection(COLLECTION_NAME).doc(tokenHash).delete();
    logger.log('Session deleted from Firestore');
  } catch (error) {
    logger.error('Failed to delete session from Firestore:', error);
    // Don't throw - session deletion is best-effort
  }
}

/**
 * Validate a session (convenience method for middleware)
 */
export async function validateSession(
  sessionToken: string
): Promise<{ valid: boolean; userId?: string }> {
  const result = await getSession(sessionToken);
  return {
    valid: result.valid,
    userId: result.userId,
  };
}

/**
 * Get session TTL in seconds (for cookie maxAge)
 */
export function getSessionTTL(): number {
  return SESSION_TTL_SECONDS;
}
