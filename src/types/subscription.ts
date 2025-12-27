// Subscription tier types
export type SubscriptionTier = 'free' | 'pro';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete';
export type SubscriptionInterval = 'monthly' | 'yearly';

export interface Subscription {
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  interval?: SubscriptionInterval;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd?: boolean;
  canceledAt?: Date;
}

export interface PricingTier {
  id: SubscriptionTier;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  limitations?: string[];
}

export const PRICING_TIERS: PricingTier[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Basic access to track your fitness',
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [
      'View workout history',
      'Browse workout programs',
      'Access exercise library',
      'Track completed workouts',
    ],
    limitations: [
      'No AI coach access',
      'Cannot generate AI workout plans',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Full AI-powered training experience',
    monthlyPrice: 9.99,
    yearlyPrice: 99.99,
    features: [
      'Everything in Free',
      'AI coach conversations',
      'Personalized workout plans',
      'Real-time exercise modifications',
      'Priority support',
    ],
  },
];

export const PRO_DAILY_MESSAGE_LIMIT = 15;

// Helper to get tier by ID
export function getTierById(id: SubscriptionTier): PricingTier | undefined {
  return PRICING_TIERS.find((tier) => tier.id === id);
}

// Helper to check if subscription is active
export function isSubscriptionActive(subscription?: Subscription): boolean {
  if (!subscription) return false;
  return subscription.status === 'active' || subscription.status === 'trialing';
}

// Helper to check if user has Pro access
export function hasProAccess(subscription?: Subscription): boolean {
  return subscription?.tier === 'pro' && isSubscriptionActive(subscription);
}
