'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PRICING_TIERS, SubscriptionInterval, SubscriptionTier } from '@/types/subscription';

export default function PricingPage() {
  const router = useRouter();
  const [interval, setInterval] = useState<SubscriptionInterval>('monthly');

  // Wireframe: Mock current subscription - use state to allow testing both states
  // Change initial value to 'pro' to test already subscribed state
  const [currentTier] = useState<SubscriptionTier>('free');

  const handleSubscribe = () => {
    // Navigate to checkout with selected interval
    router.push(`/checkout?interval=${interval}`);
  };

  const freeTier = PRICING_TIERS.find((t) => t.id === 'free')!;
  const proTier = PRICING_TIERS.find((t) => t.id === 'pro')!;
  const yearlyDiscount = Math.round(
    ((proTier.monthlyPrice * 12 - proTier.yearlyPrice) / (proTier.monthlyPrice * 12)) * 100
  );

  return (
    <div className="p-6 lg:p-6 lg:py-4 max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Choose Your Plan</h1>
        <p className="text-gray-600">
          Unlock AI-powered coaching to reach your fitness goals faster
        </p>
      </div>

      {/* Billing Toggle */}
      <div className="flex items-center justify-center mb-8">
        <div className="inline-flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setInterval('monthly')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
              interval === 'monthly'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setInterval('yearly')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${
              interval === 'yearly'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Yearly
            <span className="text-xs font-medium text-green-600">
              Save {yearlyDiscount}%
            </span>
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
        {/* Free Tier */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-gray-900">{freeTier.name}</h2>
            <p className="text-sm text-gray-600 mt-1">{freeTier.description}</p>
          </div>

          <div className="mb-6">
            <span className="text-4xl font-bold text-gray-900">Free</span>
          </div>

          <ul className="space-y-3 mb-6">
            {freeTier.features.map((feature) => (
              <li key={feature} className="flex items-start gap-2">
                <svg
                  className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-sm text-gray-700">{feature}</span>
              </li>
            ))}
            {freeTier.limitations?.map((limitation) => (
              <li key={limitation} className="flex items-start gap-2">
                <svg
                  className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                <span className="text-sm text-gray-500">{limitation}</span>
              </li>
            ))}
          </ul>

          <button
            disabled
            className="w-full py-3 px-4 bg-gray-100 text-gray-500 rounded-xl font-semibold cursor-not-allowed"
          >
            Current Plan
          </button>
        </div>

        {/* Pro Tier */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border-2 border-blue-600 relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-600 text-white">
              Recommended
            </span>
          </div>

          <div className="mb-4">
            <h2 className="text-xl font-bold text-gray-900">{proTier.name}</h2>
            <p className="text-sm text-gray-600 mt-1">{proTier.description}</p>
          </div>

          <div className="mb-6">
            <span className="text-4xl font-bold text-gray-900">
              {interval === 'monthly'
                ? `£${proTier.monthlyPrice.toFixed(2)}`
                : `£${(proTier.yearlyPrice / 12).toFixed(2)}`}
            </span>
            <span className="text-gray-500 ml-1">/month</span>
            {interval === 'yearly' && (
              <p className="text-sm text-gray-500 mt-1">
                Billed annually (£{proTier.yearlyPrice.toFixed(2)}/year)
              </p>
            )}
          </div>

          <ul className="space-y-3 mb-6">
            {proTier.features.map((feature) => (
              <li key={feature} className="flex items-start gap-2">
                <svg
                  className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-sm text-gray-700">{feature}</span>
              </li>
            ))}
          </ul>

          {currentTier === 'pro' ? (
            <button
              disabled
              className="w-full py-3 px-4 bg-gray-100 text-gray-500 rounded-xl font-semibold cursor-not-allowed"
            >
              Current Plan
            </button>
          ) : (
            <button
              onClick={handleSubscribe}
              className="w-full py-3 px-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
            >
              Subscribe to Pro
            </button>
          )}
        </div>
      </div>

      {/* Back Link */}
      <div className="text-center mt-8">
        <Link href="/profile" className="text-sm text-gray-500 hover:text-gray-700">
          Back to Profile
        </Link>
      </div>
    </div>
  );
}
