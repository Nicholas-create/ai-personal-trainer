'use client';

import Link from 'next/link';

export default function SubscriptionSuccessPage() {
  const features = [
    'AI coach conversations',
    'Personalized workout plans',
    'Real-time exercise modifications',
    'Priority support',
  ];

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6">
      <div className="text-center max-w-md">
        {/* Success Checkmark */}
        <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
          <svg
            className="w-10 h-10 text-green-600"
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
          Welcome to Pro!
        </h1>
        <p className="text-gray-600 mb-6">
          Your subscription is now active. You have full access to all Pro features.
        </p>

        {/* Features Unlocked */}
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-5 mb-6 text-left">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">
            You&apos;ve unlocked:
          </h2>
          <ul className="space-y-2">
            {features.map((feature) => (
              <li key={feature} className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-blue-600 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
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
            href="/coach"
            className="block w-full py-3 px-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            Start chatting with AI Coach
          </Link>
          <Link
            href="/subscription/manage"
            className="block w-full py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
          >
            View subscription details
          </Link>
        </div>
      </div>
    </div>
  );
}
