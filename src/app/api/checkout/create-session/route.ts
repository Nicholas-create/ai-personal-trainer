import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/verifyAuth';
import { getStripeClient, STRIPE_PRICE_IDS, verifyStripePriceConfig } from '@/lib/stripe/stripeClient';
import { getUserSubscription, storeStripeCustomerId } from '@/lib/stripe/subscriptionHelpers';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const createSessionSchema = z.object({
  interval: z.enum(['monthly', 'yearly']),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

async function handleCreateSession(
  request: NextRequest,
  { userId }: { userId: string }
) {
  try {
    // Verify Stripe configuration
    const configCheck = verifyStripePriceConfig();
    if (!configCheck.valid) {
      logger.error('Stripe configuration incomplete:', configCheck.missing);
      return NextResponse.json(
        { error: 'Payment system not configured' },
        { status: 503 }
      );
    }

    // Parse and validate request body
    const rawBody = await request.json();
    const validation = createSessionSchema.safeParse(rawBody);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { interval, successUrl, cancelUrl } = validation.data;

    // Get user's email from their subscription/user record
    const stripe = await getStripeClient();
    const subscription = await getUserSubscription(userId);

    // Check if already subscribed
    if (subscription?.tier === 'pro' && subscription?.status === 'active') {
      return NextResponse.json(
        { error: 'Already subscribed to Pro' },
        { status: 400 }
      );
    }

    // Get or create Stripe customer
    let customerId = subscription?.stripeCustomerId;

    if (!customerId) {
      // We need to get user email from Firestore
      // For now, create customer without email - Stripe will collect it at checkout
      const customer = await stripe.customers.create({
        metadata: {
          firebaseUserId: userId,
        },
      });
      customerId = customer.id;
      await storeStripeCustomerId(userId, customerId);
    }

    // Select price based on interval
    const priceId = interval === 'yearly'
      ? STRIPE_PRICE_IDS.pro_yearly
      : STRIPE_PRICE_IDS.pro_monthly;

    // Get the origin from the request for redirect URLs
    const origin = request.headers.get('origin') || 'http://localhost:3000';

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl || `${origin}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${origin}/subscription/cancelled`,
      metadata: {
        firebaseUserId: userId,
        interval,
      },
      subscription_data: {
        metadata: {
          firebaseUserId: userId,
        },
      },
      // Allow promotion codes
      allow_promotion_codes: true,
      // Collect billing address for tax purposes
      billing_address_collection: 'required',
    });

    logger.log('Created checkout session for user:', userId);

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    logger.error('Error creating checkout session:', error);

    // Handle specific Stripe errors
    if (error instanceof Error && error.message.includes('No such price')) {
      return NextResponse.json(
        { error: 'Price configuration error' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

export const POST = withAuth(handleCreateSession);
