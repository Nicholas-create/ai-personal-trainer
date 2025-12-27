'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Wireframe: Mock subscription data
const MOCK_SUBSCRIPTION = {
  currentPeriodEnd: new Date('2025-02-01'),
};

export default function CancelSubscriptionPage() {
  const router = useRouter();

  const handleCancel = () => {
    // Wireframe: Navigate to cancelled page
    router.push('/subscription/cancelled');
  };

  const loseAccessTo = [
    'AI coach conversations',
    'Personalized workout plan generation',
    'Real-time exercise modifications',
    'Priority support',
  ];

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className="p-6 lg:p-6 lg:py-4 max-w-lg mx-auto">
      {/* Warning Icon */}
      <div className="w-16 h-16 mx-auto mb-6 bg-amber-100 rounded-full flex items-center justify-center">
        <svg
          className="w-8 h-8 text-amber-600"
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

      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Are you sure?
        </h1>
        <p className="text-gray-600">
          We&apos;d hate to see you go! If you cancel, you&apos;ll lose access to Pro features.
        </p>
      </div>

      {/* What you'll lose */}
      <div className="bg-red-50 rounded-2xl p-5 mb-6">
        <h2 className="text-sm font-semibold text-red-900 mb-3">
          You&apos;ll lose access to:
        </h2>
        <ul className="space-y-2">
          {loseAccessTo.map((item) => (
            <li key={item} className="flex items-center gap-2">
              <svg
                className="w-5 h-5 text-red-500 flex-shrink-0"
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
              <span className="text-sm text-red-800">{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Access end date */}
      <div className="bg-gray-50 rounded-xl p-4 mb-6 text-center">
        <p className="text-sm text-gray-600">
          Your access will end on
        </p>
        <p className="font-semibold text-gray-900">
          {formatDate(MOCK_SUBSCRIPTION.currentPeriodEnd)}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          You&apos;ve already paid through this date
        </p>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <Link
          href="/subscription/manage"
          className="block w-full py-3 px-4 bg-blue-600 text-white text-center rounded-xl font-semibold hover:bg-blue-700 transition-colors"
        >
          Keep my subscription
        </Link>
        <button
          onClick={handleCancel}
          className="w-full py-3 px-4 bg-gray-100 text-gray-600 rounded-xl font-medium hover:bg-gray-200 transition-colors"
        >
          Yes, cancel my subscription
        </button>
      </div>

      {/* Contact Support */}
      <p className="text-center text-sm text-gray-500 mt-6">
        Having issues? <Link href="#" className="text-blue-600 hover:underline">Contact support</Link> instead.
      </p>
    </div>
  );
}
