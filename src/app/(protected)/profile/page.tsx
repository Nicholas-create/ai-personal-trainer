'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import {
  EditableChipField,
  EditableSelectField,
  EditableSessionLength,
  EditableDaysField,
} from '@/components/profile';
import { ExerciseLibrary } from '@/components/exercises';
import {
  GOAL_OPTIONS,
  LIMITATION_OPTIONS,
  EQUIPMENT_OPTIONS,
  EXPERIENCE_OPTIONS,
  DAY_OPTIONS,
  SESSION_LENGTH_OPTIONS,
  UNIT_OPTIONS,
} from '@/types/onboarding';

export default function ProfilePage() {
  const { user, signOut, refreshUser } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const handleRedoOnboarding = () => {
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
              onClick={handleSignOut}
              className="w-full py-2.5 px-5 bg-red-50 text-red-600 rounded-xl font-semibold hover:bg-red-100 transition-colors"
            >
              Log Out
            </button>
          </div>
        </div>

        {/* Profile Details - Editable */}
        <div className="lg:col-span-2 space-y-4 lg:space-y-3">
          {/* Goals */}
          <EditableChipField
            label="MY FITNESS GOALS"
            fieldName="goals"
            currentValues={user.profile?.goals || []}
            allOptions={GOAL_OPTIONS}
            colorScheme="blue"
            userId={user.uid}
            refreshUser={refreshUser}
            emptyText="No goals set yet"
            allowCustom
            customPlaceholder="Add a custom goal..."
          />

          {/* Limitations */}
          <EditableChipField
            label="LIMITATIONS & HEALTH NOTES"
            fieldName="limitations"
            currentValues={user.profile?.limitations || []}
            allOptions={LIMITATION_OPTIONS}
            colorScheme="amber"
            userId={user.uid}
            refreshUser={refreshUser}
            emptyText="No limitations specified"
            allowCustom
            customPlaceholder="Add a specific limitation or health note..."
          />

          {/* Preferences */}
          <div className="bg-white rounded-2xl p-4 lg:p-3 shadow-sm">
            <h3 className="text-xs font-semibold text-gray-500 mb-2">
              WORKOUT PREFERENCES
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <EditableSelectField
                label="Equipment"
                fieldName="equipment"
                currentValue={user.profile?.equipment || ''}
                options={EQUIPMENT_OPTIONS}
                userId={user.uid}
                refreshUser={refreshUser}
              />

              <EditableSessionLength
                currentValue={user.profile?.sessionLength || 45}
                options={SESSION_LENGTH_OPTIONS}
                userId={user.uid}
                refreshUser={refreshUser}
              />

              <EditableDaysField
                currentValues={user.profile?.workoutDays || []}
                options={DAY_OPTIONS}
                userId={user.uid}
                refreshUser={refreshUser}
              />

              <EditableSelectField
                label="Units"
                fieldName="units"
                currentValue={user.profile?.units || 'lbs'}
                options={UNIT_OPTIONS}
                userId={user.uid}
                refreshUser={refreshUser}
              />

              <div className="col-span-2">
                <EditableSelectField
                  label="Experience Level"
                  fieldName="experienceLevel"
                  currentValue={user.profile?.experienceLevel || ''}
                  options={EXPERIENCE_OPTIONS}
                  userId={user.uid}
                  refreshUser={refreshUser}
                />
              </div>
            </div>
          </div>

          {/* Re-do Onboarding - Secondary Action */}
          <div className="pt-2">
            <button
              onClick={handleRedoOnboarding}
              className="w-full py-2.5 px-5 bg-gray-100 text-gray-600 rounded-xl font-medium hover:bg-gray-200 transition-colors text-sm"
            >
              Re-do Onboarding Wizard
            </button>
            <p className="text-xs text-gray-500 text-center mt-1">
              Start fresh with the guided setup
            </p>
          </div>
        </div>
      </div>

      {/* Exercise Library - Full Width */}
      <div className="mt-6">
        <ExerciseLibrary userId={user.uid} />
      </div>
    </div>
  );
}
