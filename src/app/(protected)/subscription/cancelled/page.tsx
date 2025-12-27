'use client';

import Link from 'next/link';

// Wireframe: Mock subscription data
const MOCK_SUBSCRIPTION = {
  currentPeriodEnd: new Date('2025-02-01'),
};

export default function SubscriptionCancelledPage() {
  const freeFeatures = [
    'View workout history',
    'Browse workout programs',
    'Access exercise library',
    'Track completed workouts',
  ];

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6">
      <div className="text-center max-w-md">
        {/* Confirmation Icon */}
        <div className="w-16 h-16 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
          <svg
            className="w-8 h-8 text-gray-600"
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
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Subscription Cancelled
        </h1>
        <p className="text-gray-600 mb-6">
          Your Pro subscription has been cancelled. We&apos;re sorry to see you go.
        </p>

        {/* Access Until Notice */}
        <div className="bg-blue-50 rounded-xl p-4 mb-6">
          <p className="text-sm text-blue-900">
            You&apos;ll have access to Pro features until
          </p>
          <p className="font-semibold text-blue-900">
            {formatDate(MOCK_SUBSCRIPTION.currentPeriodEnd)}
          </p>
        </div>

        {/* What you can still do */}
        <div className="bg-gray-50 rounded-2xl p-5 mb-6 text-left">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">
            What you can still do:
          </h2>
          <ul className="space-y-2">
            {freeFeatures.map((feature) => (
              <li key={feature} className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-green-500 flex-shrink-0"
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
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Link
            href="/dashboard"
            className="block w-full py-3 px-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            Return to Dashboard
          </Link>
          <Link
            href="/pricing"
            className="block w-full py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
          >
            Changed your mind? Resubscribe
          </Link>
        </div>
      </div>
    </div>
  );
}
