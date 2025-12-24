'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import GoogleSignInButton from '@/components/auth/GoogleSignInButton';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      if (user.onboardingComplete) {
        router.push('/dashboard');
      } else {
        router.push('/onboarding');
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="spinner" />
      </div>
    );
  }

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-6">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <span className="text-white text-3xl font-bold">AI</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            AI Personal Trainer
          </h1>
          <p className="text-lg text-gray-600 leading-relaxed">
            Your personalized fitness companion powered by AI. Designed for
            simplicity and results.
          </p>
        </div>

        {/* Features */}
        <div className="space-y-4 mb-10">
          <div className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">🎯</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Personalized Plans</h3>
              <p className="text-gray-600 text-sm">
                AI creates workouts tailored to your goals
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">⚡</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Quick Logging</h3>
              <p className="text-gray-600 text-sm">
                Log workouts in seconds, not minutes
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">💬</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">AI Coach</h3>
              <p className="text-gray-600 text-sm">
                Get answers and modifications anytime
              </p>
            </div>
          </div>
        </div>

        {/* Sign In Button */}
        <GoogleSignInButton />

        {/* Footer */}
        <p className="text-center text-gray-500 text-sm mt-8">
          Designed for users 60+ with accessibility in mind
        </p>
      </div>
    </div>
  );
}
