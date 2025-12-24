'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const handleEditProfile = () => {
    router.push('/onboarding');
  };

  if (!user) return null;

  return (
    <div className="p-6 lg:p-6 lg:py-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-4 lg:mb-3">Your Profile</h1>

      <div className="grid lg:grid-cols-3 gap-6 lg:gap-4">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl p-5 lg:p-4 shadow-sm text-center">
            <div className="w-20 h-20 lg:w-16 lg:h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3 text-3xl lg:text-2xl text-white font-bold">
              {user.displayName?.charAt(0) || 'U'}
            </div>
            <h2 className="text-xl lg:text-lg font-bold text-gray-900 mb-0.5">
              {user.displayName || 'User'}
            </h2>
            <p className="text-gray-500 text-sm mb-4">{user.email}</p>

            <button
              onClick={handleEditProfile}
              className="w-full py-2.5 px-5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors mb-2"
            >
              Edit Profile
            </button>
            <button
              onClick={handleSignOut}
              className="w-full py-2.5 px-5 bg-red-50 text-red-600 rounded-xl font-semibold hover:bg-red-100 transition-colors"
            >
              Log Out
            </button>
          </div>
        </div>

        {/* Profile Details */}
        <div className="lg:col-span-2 space-y-4 lg:space-y-3">
          {/* Goals */}
          <div className="bg-white rounded-2xl p-4 lg:p-3 shadow-sm">
            <h3 className="text-xs font-semibold text-gray-500 mb-2">
              MY FITNESS GOALS
            </h3>
            <div className="flex flex-wrap gap-2">
              {user.profile?.goals?.map((goal) => (
                <span
                  key={goal}
                  className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full font-medium text-sm"
                >
                  {goal.replace('_', ' ')}
                </span>
              )) || (
                <span className="text-gray-500 text-sm">No goals set yet</span>
              )}
            </div>
          </div>

          {/* Limitations */}
          <div className="bg-white rounded-2xl p-4 lg:p-3 shadow-sm">
            <h3 className="text-xs font-semibold text-gray-500 mb-2">
              LIMITATIONS & HEALTH NOTES
            </h3>
            <div className="flex flex-wrap gap-2">
              {user.profile?.limitations?.length ? (
                user.profile.limitations.map((limit) => (
                  <span
                    key={limit}
                    className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded-full font-medium text-sm"
                  >
                    {limit.replace('_', ' ')}
                  </span>
                ))
              ) : (
                <span className="text-gray-500 text-sm">No limitations specified</span>
              )}
            </div>
          </div>

          {/* Preferences */}
          <div className="bg-white rounded-2xl p-4 lg:p-3 shadow-sm">
            <h3 className="text-xs font-semibold text-gray-500 mb-2">
              WORKOUT PREFERENCES
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 lg:p-2 bg-gray-50 rounded-xl">
                <p className="text-gray-500 text-xs">Equipment</p>
                <p className="font-semibold text-gray-900 text-sm">
                  {user.profile?.equipment?.replace('_', ' ') || 'Not set'}
                </p>
              </div>
              <div className="p-3 lg:p-2 bg-gray-50 rounded-xl">
                <p className="text-gray-500 text-xs">Session Length</p>
                <p className="font-semibold text-gray-900 text-sm">
                  {user.profile?.sessionLength || 45} minutes
                </p>
              </div>
              <div className="p-3 lg:p-2 bg-gray-50 rounded-xl">
                <p className="text-gray-500 text-xs">Workout Days</p>
                <p className="font-semibold text-gray-900 text-sm">
                  {user.profile?.workoutDays?.join(', ') || 'Not set'}
                </p>
              </div>
              <div className="p-3 lg:p-2 bg-gray-50 rounded-xl">
                <p className="text-gray-500 text-xs">Units</p>
                <p className="font-semibold text-gray-900 text-sm">
                  {user.profile?.units === 'kg' ? 'Kilograms (kg)' : 'Pounds (lbs)'}
                </p>
              </div>
              <div className="p-3 lg:p-2 bg-gray-50 rounded-xl col-span-2">
                <p className="text-gray-500 text-xs">Experience Level</p>
                <p className="font-semibold text-gray-900 text-sm capitalize">
                  {user.profile?.experienceLevel || 'Not set'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
