'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { fetchWithAuth } from '@/lib/api/fetchWithAuth';
import type { Subscription, SubscriptionInterval } from '@/types/subscription';
import { logger } from '@/lib/logger';

export default function ManageSubscriptionPage() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    // Get subscription from user data
    if (user) {
      // For now, subscription comes from user object
      // In future, could fetch from dedicated endpoint
      const sub = (user as unknown as { subscription?: Subscription }).subscription;
      setSubscription(sub || null);
      setLoading(false);
    }
  }, [user]);

  const handleManageBilling = async () => {
    setPortalLoading(true);
    try {
      const response = await fetchWithAuth('/api/checkout/portal-session', {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to open billing portal');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      logger.error('Portal error:', error);
      alert('Unable to open billing portal. Please try again.');
      setPortalLoading(false);
    }
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const monthlyPrice = 9.99;
  const yearlyPrice = 99.99;

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!subscription || subscription.tier !== 'pro') {
    return (
      <div className="p-6 lg:p-6 lg:py-4 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Manage Subscription
        </h1>
        <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
          <p className="text-gray-600 mb-4">You don&apos;t have an active Pro subscription.</p>
          <Link
            href="/pricing"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
          >
            View Plans
          </Link>
        </div>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    trialing: 'bg-blue-100 text-blue-800',
    past_due: 'bg-yellow-100 text-yellow-800',
    canceled: 'bg-red-100 text-red-800',
    incomplete: 'bg-gray-100 text-gray-800',
  };

  return (
    <div className="p-6 lg:p-6 lg:py-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Manage Subscription
      </h1>

      {/* Current Plan Card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-blue-600 to-purple-600 text-white mb-2">
              Pro {subscription.interval === 'yearly' ? 'Yearly' : 'Monthly'}
            </span>
            <h2 className="text-lg font-semibold text-gray-900">Current Plan</h2>
          </div>
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[subscription.status] || statusColors.incomplete}`}>
            {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
          </span>
        </div>

        {subscription.cancelAtPeriodEnd && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              Your subscription will end on {formatDate(subscription.currentPeriodEnd)}.
              You&apos;ll continue to have access until then.
            </p>
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Billing amount</p>
            <p className="font-semibold text-gray-900">
              {subscription.interval === 'monthly'
                ? `£${monthlyPrice.toFixed(2)}/month`
                : `£${yearlyPrice.toFixed(2)}/year`}
            </p>
          </div>
          <div>
            <p className="text-gray-500">
              {subscription.cancelAtPeriodEnd ? 'Access ends' : 'Next billing date'}
            </p>
            <p className="font-semibold text-gray-900">
              {formatDate(subscription.currentPeriodEnd)}
            </p>
          </div>
          <div>
            <p className="text-gray-500">Member since</p>
            <p className="font-semibold text-gray-900">
              {formatDate(subscription.currentPeriodStart)}
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <button
          onClick={handleManageBilling}
          disabled={portalLoading}
          className="w-full py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {portalLoading ? (
            <div className="animate-spin w-5 h-5 border-2 border-gray-700 border-t-transparent rounded-full" />
          ) : (
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          )}
          Manage Billing & Payment
        </button>

        <p className="text-xs text-center text-gray-500">
          Update payment method, change plan, download invoices, or cancel subscription in the Stripe billing portal.
        </p>
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
