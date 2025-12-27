import Anthropic from '@anthropic-ai/sdk';
import { getAnthropicApiKey } from '@/lib/secrets/firestoreSecrets';

/**
 * Shared Anthropic client with lazy initialization
 * Fetches API key from Firestore on first use
 */

let anthropicClient: Anthropic | null = null;

/**
 * Default timeout for API requests (60 seconds)
 * AI calls can take a while, especially for complex prompts
 */
export const DEFAULT_TIMEOUT_MS = 60000;

/**
 * Get the shared Anthropic client instance
 * Creates the client on first call, reuses it thereafter
 * Configured with default timeout to prevent hanging requests
 */
export async function getAnthropicClient(): Promise<Anthropic> {
  if (!anthropicClient) {
    const apiKey = await getAnthropicApiKey();
    anthropicClient = new Anthropic({
      apiKey,
      timeout: DEFAULT_TIMEOUT_MS,
      maxRetries: 2, // Retry on transient failures
    });
  }
  return anthropicClient;
}

/**
 * Reset the client (useful for testing or if API key changes)
 */
export function resetAnthropicClient(): void {
  anthropicClient = null;
}

/**
 * Default model to use for AI responses
 */
export const DEFAULT_MODEL = 'claude-sonnet-4-20250514';

/**
 * Model configuration options with timeouts
 */
export const MODEL_CONFIG = {
  chat: {
    model: DEFAULT_MODEL,
    maxTokens: 4096,
    timeout: 60000, // 60 seconds for chat
  },
  chatContinuation: {
    model: DEFAULT_MODEL,
    maxTokens: 2048,
    timeout: 45000, // 45 seconds for continuation
  },
  planGeneration: {
    model: DEFAULT_MODEL,
    maxTokens: 4096,
    timeout: 90000, // 90 seconds for plan generation (more complex)
  },
  onboarding: {
    model: DEFAULT_MODEL,
    maxTokens: 1024,
    timeout: 30000, // 30 seconds for onboarding
  },
} as const;
