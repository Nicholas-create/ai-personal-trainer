import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getStripeClient, getStripeWebhookSecret } from '@/lib/stripe/stripeClient';
import { updateUserSubscription, downgradeToFree } from '@/lib/stripe/subscriptionHelpers';
import { logger } from '@/lib/logger';
import type { SubscriptionInterval } from '@/types/subscription';

/**
 * Stripe webhook handler
 * Processes subscription lifecycle events from Stripe
 *
 * Security: Verifies webhook signature before processing
 */
export async function POST(request: NextRequest) {
  try {
    const stripe = await getStripeClient();
    const webhookSecret = await getStripeWebhookSecret();

    // Get raw body for signature verification
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      logger.error('Missing Stripe signature header');
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      logger.error('Webhook signature verification failed:', message);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    logger.log('Processing Stripe webhook:', event.type);

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutComplete(session);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentSucceeded(invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }

      default:
        logger.log('Unhandled event type:', event.type);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 * Handle successful checkout session
 */
async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.firebaseUserId;

  if (!userId) {
    logger.error('No firebaseUserId in checkout session metadata');
    return;
  }

  logger.log('Checkout completed for user:', userId);

  // Subscription details will be handled by the subscription.created event
  // Just log the successful checkout here
}

/**
 * Handle subscription creation or update
 */
async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.firebaseUserId;

  if (!userId) {
    logger.error('No firebaseUserId in subscription metadata');
    return;
  }

  // Determine interval from the price
  const interval: SubscriptionInterval = subscription.items.data[0]?.price.recurring?.interval === 'year'
    ? 'yearly'
    : 'monthly';

  // Map Stripe status to our status
  const statusMap: Record<string, string> = {
    active: 'active',
    trialing: 'trialing',
    past_due: 'past_due',
    canceled: 'canceled',
    incomplete: 'incomplete',
    incomplete_expired: 'canceled',
    unpaid: 'past_due',
    paused: 'canceled',
  };

  const status = statusMap[subscription.status] || 'incomplete';

  // Extract period dates from subscription object
  // These are Unix timestamps in seconds
  const subscriptionData = subscription as unknown as {
    current_period_start: number;
    current_period_end: number;
    cancel_at_period_end: boolean;
    canceled_at: number | null;
  };

  await updateUserSubscription(userId, {
    tier: status === 'active' || status === 'trialing' ? 'pro' : 'free',
    status: status as 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete',
    stripeSubscriptionId: subscription.id,
    interval,
    currentPeriodStart: new Date(subscriptionData.current_period_start * 1000),
    currentPeriodEnd: new Date(subscriptionData.current_period_end * 1000),
    cancelAtPeriodEnd: subscriptionData.cancel_at_period_end,
    canceledAt: subscriptionData.canceled_at ? new Date(subscriptionData.canceled_at * 1000) : undefined,
  });

  logger.log('Updated subscription for user:', userId, 'Status:', status);
}

/**
 * Handle subscription deletion
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.firebaseUserId;

  if (!userId) {
    logger.error('No firebaseUserId in subscription metadata');
    return;
  }

  // Downgrade to free tier
  await downgradeToFree(userId);
  logger.log('Subscription deleted, downgraded user to free:', userId);
}

/**
 * Handle successful payment
 */
async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  // Payment succeeded - subscription should already be updated
  // This is mostly for logging/analytics
  const customerId = invoice.customer as string;
  logger.log('Payment succeeded for customer:', customerId);
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(invoice: Stripe.Invoice) {
  // Payment failed - Stripe will retry automatically
  // We could send a notification to the user here
  const customerId = invoice.customer as string;
  logger.warn('Payment failed for customer:', customerId);

  // The subscription status will be updated automatically by Stripe
  // and we'll receive a subscription.updated event
}
