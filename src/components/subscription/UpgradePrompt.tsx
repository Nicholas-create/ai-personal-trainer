'use client';

import Link from 'next/link';

interface UpgradePromptProps {
  onDismiss?: () => void;
  variant?: 'modal' | 'inline';
}

export function UpgradePrompt({ onDismiss, variant = 'inline' }: UpgradePromptProps) {
  const benefits = [
    'AI-powered workout coaching',
    'Personalized plan generation',
    'Real-time exercise modifications',
    '15 messages per day',
  ];

  const content = (
    <div className="text-center">
      {/* Lock Icon */}
      <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
        <svg
          className="w-8 h-8 text-blue-600"
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
      </div>

      <h2 className="text-xl font-bold text-gray-900 mb-2">
        Unlock AI Coach
      </h2>
      <p className="text-gray-600 mb-6">
        Get personalized AI coaching to achieve your fitness goals faster.
      </p>

      {/* Benefits List */}
      <ul className="space-y-2 mb-6 text-left max-w-xs mx-auto">
        {benefits.map((benefit) => (
          <li key={benefit} className="flex items-center gap-2">
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
            <span className="text-sm text-gray-700">{benefit}</span>
          </li>
        ))}
      </ul>

      {/* Price Badge */}
      <div className="mb-6">
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700">
          Starting at just £9.99/month
        </span>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <Link
          href="/pricing"
          className="block w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-colors"
        >
          Upgrade to Pro
        </Link>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="w-full py-2 text-sm text-gray-500 hover:text-gray-700"
          >
            Maybe later
          </button>
        )}
      </div>
    </div>
  );

  if (variant === 'modal') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
      {content}
    </div>
  );
}
