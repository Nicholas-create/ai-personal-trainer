import Stripe from 'stripe';
import { getSecret } from '@/lib/secrets/firestoreSecrets';

let stripeClient: Stripe | null = null;

/**
 * Get the shared Stripe client instance
 * Creates the client on first call, reuses it thereafter
 */
export async function getStripeClient(): Promise<Stripe> {
  if (!stripeClient) {
    // First try environment variable (for local development)
    let apiKey: string | undefined = process.env.STRIPE_SECRET_KEY;

    if (!apiKey) {
      // Fall back to Firestore secrets
      const secretKey = await getSecret('STRIPE_SECRET_KEY');
      if (!secretKey) {
        throw new Error('STRIPE_SECRET_KEY not configured');
      }
      apiKey = secretKey;
    }

    stripeClient = new Stripe(apiKey, {
      apiVersion: '2025-12-15.clover',
      typescript: true,
    });
  }
  return stripeClient;
}

/**
 * Get the Stripe webhook secret for signature verification
 */
export async function getStripeWebhookSecret(): Promise<string> {
  // First try environment variable
  const envSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (envSecret) {
    return envSecret;
  }

  // Fall back to Firestore secrets
  const firestoreSecret = await getSecret('STRIPE_WEBHOOK_SECRET');
  if (!firestoreSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET not configured');
  }
  return firestoreSecret;
}

/**
 * Reset the client (useful for testing or if API key changes)
 */
export function resetStripeClient(): void {
  stripeClient = null;
}

/**
 * Stripe Price IDs for subscription tiers
 * These should be configured in your Stripe dashboard
 */
export const STRIPE_PRICE_IDS = {
  pro_monthly: process.env.STRIPE_PRICE_PRO_MONTHLY || '',
  pro_yearly: process.env.STRIPE_PRICE_PRO_YEARLY || '',
} as const;

/**
 * Verify that required Stripe price IDs are configured
 */
export function verifyStripePriceConfig(): { valid: boolean; missing: string[] } {
  const missing: string[] = [];

  if (!STRIPE_PRICE_IDS.pro_monthly) {
    missing.push('STRIPE_PRICE_PRO_MONTHLY');
  }
  if (!STRIPE_PRICE_IDS.pro_yearly) {
    missing.push('STRIPE_PRICE_PRO_YEARLY');
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}
