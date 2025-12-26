import { getAdminApp } from '@/lib/firebase/admin';
import { getFirestore } from 'firebase-admin/firestore';
import { logger } from '@/lib/logger';

// In-memory cache for secrets to avoid fetching on every request
const secretsCache: Map<string, { value: string; expiresAt: number }> = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Known secret keys
export type SecretKey = 'ANTHROPIC_API_KEY' | 'FIREBASE_SERVICE_ACCOUNT_KEY';

/**
 * Get a secret from Firestore (with caching)
 *
 * Secrets are stored in a 'secrets' collection with document ID = secret name
 * Each document has a 'value' field containing the secret
 *
 * @param key - The secret key to retrieve
 * @returns The secret value or null if not found
 */
export async function getSecret(key: SecretKey): Promise<string | null> {
  // Check cache first
  const cached = secretsCache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  try {
    const app = getAdminApp();
    const db = getFirestore(app);

    const docRef = db.collection('secrets').doc(key);
    const doc = await docRef.get();

    if (!doc.exists) {
      logger.error(`Secret not found: ${key}`);
      return null;
    }

    const data = doc.data();
    const value = data?.value as string;

    if (!value) {
      logger.error(`Secret has no value: ${key}`);
      return null;
    }

    // Cache the secret
    secretsCache.set(key, {
      value,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });

    return value;
  } catch (error) {
    logger.error(`Error fetching secret ${key}:`, error);
    return null;
  }
}

/**
 * Get Anthropic API key from Firestore
 */
export async function getAnthropicApiKey(): Promise<string> {
  // First try environment variable (for local development)
  if (process.env.ANTHROPIC_API_KEY) {
    return process.env.ANTHROPIC_API_KEY;
  }

  // Fall back to Firestore
  const key = await getSecret('ANTHROPIC_API_KEY');
  if (!key) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }
  return key;
}

/**
 * Clear the secrets cache (useful for testing or rotation)
 */
export function clearSecretsCache(): void {
  secretsCache.clear();
}

/**
 * Preload secrets into cache (call during cold start)
 */
export async function preloadSecrets(): Promise<void> {
  const keys: SecretKey[] = ['ANTHROPIC_API_KEY'];
  await Promise.all(keys.map((key) => getSecret(key)));
}
