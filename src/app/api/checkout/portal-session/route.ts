import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/verifyAuth';
import { getStripeClient } from '@/lib/stripe/stripeClient';
import { getUserSubscription } from '@/lib/stripe/subscriptionHelpers';
import { logger } from '@/lib/logger';

/**
 * Create a Stripe Customer Portal session
 * Allows users to manage their subscription (update payment, cancel, etc.)
 */
async function handlePortalSession(
  request: NextRequest,
  { userId }: { userId: string }
) {
  try {
    const subscription = await getUserSubscription(userId);

    if (!subscription?.stripeCustomerId) {
      return NextResponse.json(
        { error: 'No subscription found' },
        { status: 404 }
      );
    }

    const stripe = await getStripeClient();
    const origin = request.headers.get('origin') || 'http://localhost:3000';

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${origin}/subscription/manage`,
    });

    logger.log('Created portal session for user:', userId);

    return NextResponse.json({
      url: session.url,
    });
  } catch (error) {
    logger.error('Error creating portal session:', error);
    return NextResponse.json(
      { error: 'Failed to create portal session' },
      { status: 500 }
    );
  }
}

export const POST = withAuth(handlePortalSession);
