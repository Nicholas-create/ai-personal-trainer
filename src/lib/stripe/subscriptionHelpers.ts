import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getAdminApp } from '@/lib/firebase/admin';
import { logger } from '@/lib/logger';
import type { Subscription, SubscriptionTier, SubscriptionStatus, SubscriptionInterval } from '@/types/subscription';

/**
 * Get Firestore instance for subscription operations
 */
function getDb() {
  const app = getAdminApp();
  return getFirestore(app);
}

/**
 * Get a user's subscription data
 */
export async function getUserSubscription(userId: string): Promise<Subscription | null> {
  try {
    const db = getDb();
    const userDoc = await db.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      return null;
    }

    const data = userDoc.data();
    if (!data?.subscription) {
      return null;
    }

    const sub = data.subscription;
    return {
      tier: sub.tier as SubscriptionTier,
      status: sub.status as SubscriptionStatus,
      stripeCustomerId: sub.stripeCustomerId,
      stripeSubscriptionId: sub.stripeSubscriptionId,
      interval: sub.interval as SubscriptionInterval | undefined,
      currentPeriodStart: sub.currentPeriodStart?.toDate?.() || undefined,
      currentPeriodEnd: sub.currentPeriodEnd?.toDate?.() || undefined,
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
      canceledAt: sub.canceledAt?.toDate?.() || undefined,
    };
  } catch (error) {
    logger.error('Error getting user subscription:', error);
    return null;
  }
}

/**
 * Update a user's subscription data
 */
export async function updateUserSubscription(
  userId: string,
  subscriptionData: Partial<Subscription> & { stripeCustomerId?: string }
): Promise<void> {
  try {
    const db = getDb();
    const userRef = db.collection('users').doc(userId);

    const updateData: Record<string, unknown> = {};

    if (subscriptionData.tier !== undefined) {
      updateData['subscription.tier'] = subscriptionData.tier;
    }
    if (subscriptionData.status !== undefined) {
      updateData['subscription.status'] = subscriptionData.status;
    }
    if (subscriptionData.stripeCustomerId !== undefined) {
      updateData['subscription.stripeCustomerId'] = subscriptionData.stripeCustomerId;
    }
    if (subscriptionData.stripeSubscriptionId !== undefined) {
      updateData['subscription.stripeSubscriptionId'] = subscriptionData.stripeSubscriptionId;
    }
    if (subscriptionData.interval !== undefined) {
      updateData['subscription.interval'] = subscriptionData.interval;
    }
    if (subscriptionData.currentPeriodStart !== undefined) {
      updateData['subscription.currentPeriodStart'] = Timestamp.fromDate(subscriptionData.currentPeriodStart);
    }
    if (subscriptionData.currentPeriodEnd !== undefined) {
      updateData['subscription.currentPeriodEnd'] = Timestamp.fromDate(subscriptionData.currentPeriodEnd);
    }
    if (subscriptionData.cancelAtPeriodEnd !== undefined) {
      updateData['subscription.cancelAtPeriodEnd'] = subscriptionData.cancelAtPeriodEnd;
    }
    if (subscriptionData.canceledAt !== undefined) {
      updateData['subscription.canceledAt'] = Timestamp.fromDate(subscriptionData.canceledAt);
    }

    await userRef.update(updateData);
    logger.log('Updated subscription for user:', userId);
  } catch (error) {
    logger.error('Error updating user subscription:', error);
    throw error;
  }
}

/**
 * Initialize a free subscription for a new user
 */
export async function initializeFreeSubscription(userId: string): Promise<void> {
  try {
    const db = getDb();
    const userRef = db.collection('users').doc(userId);

    await userRef.update({
      'subscription.tier': 'free',
      'subscription.status': 'active',
    });

    logger.log('Initialized free subscription for user:', userId);
  } catch (error) {
    logger.error('Error initializing free subscription:', error);
    throw error;
  }
}

/**
 * Get or create Stripe customer ID for a user
 */
export async function getOrCreateStripeCustomerId(
  userId: string,
  email: string,
  name?: string
): Promise<string | null> {
  try {
    const subscription = await getUserSubscription(userId);

    if (subscription?.stripeCustomerId) {
      return subscription.stripeCustomerId;
    }

    // Will be set after creating customer in Stripe
    return null;
  } catch (error) {
    logger.error('Error getting Stripe customer ID:', error);
    return null;
  }
}

/**
 * Store Stripe customer ID for a user
 */
export async function storeStripeCustomerId(userId: string, customerId: string): Promise<void> {
  await updateUserSubscription(userId, { stripeCustomerId: customerId });
}

/**
 * Cancel a user's subscription (marks as canceled but keeps active until period end)
 */
export async function cancelSubscription(userId: string): Promise<void> {
  await updateUserSubscription(userId, {
    cancelAtPeriodEnd: true,
    canceledAt: new Date(),
  });
}

/**
 * Downgrade a user to free tier (immediate effect)
 */
export async function downgradeToFree(userId: string): Promise<void> {
  await updateUserSubscription(userId, {
    tier: 'free',
    status: 'active',
    stripeSubscriptionId: undefined,
    interval: undefined,
    currentPeriodStart: undefined,
    currentPeriodEnd: undefined,
    cancelAtPeriodEnd: false,
    canceledAt: undefined,
  });
}
