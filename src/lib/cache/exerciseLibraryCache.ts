import { logger } from '@/lib/logger';

/**
 * Server-side cache for exercise library data
 * Reduces payload size on chat requests by caching exercise library per user
 */

interface ExerciseData {
  id: string;
  name: string;
  primaryMuscles: string[];
  secondaryMuscles?: string[];
  equipmentRequired: string[];
  difficulty: string;
  instructions: string[];
  tips?: string[];
}

interface CacheEntry {
  exercises: ExerciseData[];
  hash: string;
  updatedAt: number;
  expiresAt: number;
}

// In-memory cache (in production with multiple instances, use Redis)
const exerciseLibraryCache = new Map<string, CacheEntry>();

// Cache configuration
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
let lastCleanup = Date.now();

/**
 * Generate a hash for an exercise library to detect changes
 */
function generateLibraryHash(exercises: ExerciseData[]): string {
  // Simple hash based on exercise count and names
  const names = exercises.map((e) => e.name).sort().join(',');
  const count = exercises.length;
  // Simple string hash
  let hash = 0;
  const str = `${count}:${names}`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(36);
}

/**
 * Clean up expired cache entries
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;

  lastCleanup = now;
  let cleaned = 0;
  for (const [key, entry] of exerciseLibraryCache.entries()) {
    if (entry.expiresAt < now) {
      exerciseLibraryCache.delete(key);
      cleaned++;
    }
  }
  if (cleaned > 0) {
    logger.log(`Cleaned up ${cleaned} expired exercise library cache entries`);
  }
}

/**
 * Get cached exercise library for a user
 * Returns null if not cached or expired
 */
export function getCachedExerciseLibrary(userId: string): ExerciseData[] | null {
  cleanupExpiredEntries();

  const entry = exerciseLibraryCache.get(userId);
  if (!entry) return null;

  if (entry.expiresAt < Date.now()) {
    exerciseLibraryCache.delete(userId);
    return null;
  }

  return entry.exercises;
}

/**
 * Cache exercise library for a user
 */
export function cacheExerciseLibrary(
  userId: string,
  exercises: ExerciseData[]
): void {
  const now = Date.now();
  const hash = generateLibraryHash(exercises);

  exerciseLibraryCache.set(userId, {
    exercises,
    hash,
    updatedAt: now,
    expiresAt: now + CACHE_TTL_MS,
  });
}

/**
 * Check if client's library hash matches cached version
 * Returns true if cache is valid and matches
 */
export function isCacheValid(userId: string, clientHash?: string): boolean {
  const entry = exerciseLibraryCache.get(userId);
  if (!entry) return false;
  if (entry.expiresAt < Date.now()) return false;
  if (!clientHash) return false;

  return entry.hash === clientHash;
}

/**
 * Get cache hash for a user (for client to send on subsequent requests)
 */
export function getCacheHash(userId: string): string | null {
  const entry = exerciseLibraryCache.get(userId);
  if (!entry || entry.expiresAt < Date.now()) return null;
  return entry.hash;
}

/**
 * Invalidate cache for a user (call when exercise library is modified)
 */
export function invalidateCache(userId: string): void {
  exerciseLibraryCache.delete(userId);
}

/**
 * Get or set exercise library with cache
 * If clientHash matches cached version, returns cached data
 * Otherwise caches new data and returns it
 */
export function getOrCacheExerciseLibrary(
  userId: string,
  exercises: ExerciseData[],
  clientHash?: string
): { exercises: ExerciseData[]; hash: string; fromCache: boolean } {
  cleanupExpiredEntries();

  // Check if we can use cached data
  if (clientHash && isCacheValid(userId, clientHash)) {
    const cached = getCachedExerciseLibrary(userId);
    if (cached) {
      return {
        exercises: cached,
        hash: clientHash,
        fromCache: true,
      };
    }
  }

  // Cache new data
  cacheExerciseLibrary(userId, exercises);
  const hash = generateLibraryHash(exercises);

  return {
    exercises,
    hash,
    fromCache: false,
  };
}

/**
 * Get cache statistics (for monitoring)
 */
export function getCacheStats(): {
  totalEntries: number;
  memoryEstimate: string;
} {
  let totalExercises = 0;
  for (const entry of exerciseLibraryCache.values()) {
    totalExercises += entry.exercises.length;
  }

  // Rough estimate: ~500 bytes per exercise
  const memoryBytes = totalExercises * 500;
  const memoryMB = (memoryBytes / 1024 / 1024).toFixed(2);

  return {
    totalEntries: exerciseLibraryCache.size,
    memoryEstimate: `~${memoryMB} MB`,
  };
}
