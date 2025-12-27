'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { fetchWithAuth } from '@/lib/api/fetchWithAuth';
import { logger } from '@/lib/logger';

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showFallback, setShowFallback] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function createCheckoutSession() {
      try {
        // Get interval from URL params (default to monthly)
        const interval = searchParams.get('interval') === 'yearly' ? 'yearly' : 'monthly';

        const response = await fetchWithAuth('/api/checkout/create-session', {
          method: 'POST',
          body: JSON.stringify({ interval }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));

          // Handle specific errors
          if (response.status === 503) {
            setError('Payment system is being configured. Please try again later.');
            setShowFallback(true);
            return;
          }

          if (data.error === 'Already subscribed to Pro') {
            router.push('/subscription/manage');
            return;
          }

          throw new Error(data.error || 'Failed to create checkout session');
        }

        const { url } = await response.json();

        if (url) {
          // Redirect to Stripe Checkout
          window.location.href = url;
        } else {
          throw new Error('No checkout URL received');
        }
      } catch (err) {
        logger.error('Checkout error:', err);
        setError(err instanceof Error ? err.message : 'Something went wrong');
        setShowFallback(true);
      }
    }

    createCheckoutSession();

    // Show fallback link after 10 seconds
    const fallbackTimer = setTimeout(() => {
      setShowFallback(true);
    }, 10000);

    return () => {
      clearTimeout(fallbackTimer);
    };
  }, [router, searchParams]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6">
      <div className="text-center">
        {error ? (
          <>
            {/* Error State */}
            <div className="w-16 h-16 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            <h1 className="text-xl font-bold text-gray-900 mb-2">
              Unable to Start Checkout
            </h1>
            <p className="text-gray-600 mb-6">{error}</p>

            <div className="flex gap-3 justify-center">
              <Link
                href="/pricing"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
              >
                Return to Pricing
              </Link>
            </div>
          </>
        ) : (
          <>
            {/* Loading Spinner */}
            <div className="w-16 h-16 mx-auto mb-6">
              <svg
                className="animate-spin w-full h-full text-blue-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>

            <h1 className="text-xl font-bold text-gray-900 mb-2">
              Redirecting to secure checkout...
            </h1>
            <p className="text-gray-600 mb-6">
              You&apos;ll be redirected to Stripe to complete your payment securely.
            </p>

            {/* Security Badge */}
            <div className="inline-flex items-center gap-2 text-sm text-gray-500 mb-6">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              <span>256-bit SSL encryption</span>
            </div>

            {/* Fallback Link */}
            {showFallback && (
              <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-600 mb-2">
                  Taking too long? Try again or contact support.
                </p>
                <Link
                  href="/pricing"
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Return to pricing
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
