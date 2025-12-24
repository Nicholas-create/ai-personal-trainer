'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { updateUserProfile } from '@/lib/firebase/firestore';
import type { UserProfile } from '@/types/user';

const GOALS = [
  { id: 'strength', label: 'Build Strength', icon: '💪' },
  { id: 'mobility', label: 'Improve Mobility', icon: '🧘' },
  { id: 'weight_loss', label: 'Lose Weight', icon: '⚖️' },
  { id: 'endurance', label: 'Build Endurance', icon: '🏃' },
  { id: 'rehabilitation', label: 'Rehabilitation', icon: '🩹' },
  { id: 'general', label: 'General Fitness', icon: '❤️' },
];

const LIMITATIONS = [
  { id: 'knee', label: 'Knee Issues', icon: '🦵' },
  { id: 'back', label: 'Back Problems', icon: '🔙' },
  { id: 'shoulder', label: 'Shoulder Issues', icon: '💪' },
  { id: 'hip', label: 'Hip Problems', icon: '🦴' },
  { id: 'wrist', label: 'Wrist/Hand Issues', icon: '🤚' },
  { id: 'none', label: 'No Limitations', icon: '✅' },
];

const EQUIPMENT = [
  { id: 'full_gym', label: 'Full Gym Access', description: 'Machines, free weights, cables' },
  { id: 'home', label: 'Home Equipment', description: 'Dumbbells, resistance bands, bench' },
  { id: 'minimal', label: 'Minimal/Bodyweight', description: 'Little to no equipment' },
];

const EXPERIENCE = [
  { id: 'beginner', label: 'Beginner', description: 'New to exercise or returning after a long break' },
  { id: 'intermediate', label: 'Intermediate', description: 'Some experience, know basic exercises' },
  { id: 'advanced', label: 'Advanced', description: 'Very experienced, comfortable with complex movements' },
];

const DAYS = [
  { id: 'monday', label: 'Mon' },
  { id: 'tuesday', label: 'Tue' },
  { id: 'wednesday', label: 'Wed' },
  { id: 'thursday', label: 'Thu' },
  { id: 'friday', label: 'Fri' },
  { id: 'saturday', label: 'Sat' },
  { id: 'sunday', label: 'Sun' },
];

const DURATIONS = [
  { id: 30, label: '30 min' },
  { id: 45, label: '45 min' },
  { id: 60, label: '60 min' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Form state
  const [goals, setGoals] = useState<string[]>([]);
  const [limitations, setLimitations] = useState<string[]>([]);
  const [equipment, setEquipment] = useState<string>('');
  const [experience, setExperience] = useState<string>('');
  const [workoutDays, setWorkoutDays] = useState<string[]>([]);
  const [sessionLength, setSessionLength] = useState<number>(45);
  const [units, setUnits] = useState<'lbs' | 'kg'>('lbs');

  const totalSteps = 5;

  const toggleGoal = (goalId: string) => {
    setGoals((prev) =>
      prev.includes(goalId)
        ? prev.filter((g) => g !== goalId)
        : [...prev, goalId]
    );
  };

  const toggleLimitation = (limitId: string) => {
    if (limitId === 'none') {
      setLimitations(['none']);
    } else {
      setLimitations((prev) => {
        const newLimits = prev.filter((l) => l !== 'none');
        return newLimits.includes(limitId)
          ? newLimits.filter((l) => l !== limitId)
          : [...newLimits, limitId];
      });
    }
  };

  const toggleDay = (dayId: string) => {
    setWorkoutDays((prev) =>
      prev.includes(dayId)
        ? prev.filter((d) => d !== dayId)
        : [...prev, dayId]
    );
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return goals.length > 0;
      case 2:
        return limitations.length > 0;
      case 3:
        return equipment !== '' && experience !== '';
      case 4:
        return workoutDays.length > 0;
      case 5:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleComplete = async () => {
    if (!user) return;

    try {
      setSaving(true);

      const profile: UserProfile = {
        goals,
        limitations: limitations.filter((l) => l !== 'none'),
        equipment: equipment as 'full_gym' | 'home' | 'minimal',
        experienceLevel: experience as 'beginner' | 'intermediate' | 'advanced',
        workoutDays,
        sessionLength,
        units,
      };

      await updateUserProfile(user.uid, profile);
      await refreshUser();
      router.push('/dashboard');
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-6">
      <div className="max-w-2xl mx-auto">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-500">
              Step {step} of {totalSteps}
            </span>
            <span className="text-sm text-gray-500">
              {Math.round((step / totalSteps) * 100)}% complete
            </span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Step 1: Goals */}
        {step === 1 && (
          <div>
            <h1 className="text-2xl font-bold mb-2">What are your fitness goals?</h1>
            <p className="text-gray-600 mb-8">Select all that apply. We&apos;ll create a plan tailored to your needs.</p>

            <div className="grid grid-cols-2 gap-4">
              {GOALS.map((goal) => (
                <button
                  key={goal.id}
                  onClick={() => toggleGoal(goal.id)}
                  className={`p-6 rounded-xl border-2 text-left transition-all ${
                    goals.includes(goal.id)
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <span className="text-3xl mb-3 block">{goal.icon}</span>
                  <span className="font-semibold text-lg">{goal.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Limitations */}
        {step === 2 && (
          <div>
            <h1 className="text-2xl font-bold mb-2">Any physical limitations?</h1>
            <p className="text-gray-600 mb-8">We&apos;ll avoid exercises that might aggravate these areas.</p>

            <div className="grid grid-cols-2 gap-4">
              {LIMITATIONS.map((limit) => (
                <button
                  key={limit.id}
                  onClick={() => toggleLimitation(limit.id)}
                  className={`p-6 rounded-xl border-2 text-left transition-all ${
                    limitations.includes(limit.id)
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <span className="text-3xl mb-3 block">{limit.icon}</span>
                  <span className="font-semibold text-lg">{limit.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Equipment & Experience */}
        {step === 3 && (
          <div>
            <h1 className="text-2xl font-bold mb-2">Your equipment & experience</h1>
            <p className="text-gray-600 mb-8">This helps us suggest appropriate exercises.</p>

            <h3 className="font-semibold text-lg mb-4">What equipment do you have access to?</h3>
            <div className="space-y-3 mb-8">
              {EQUIPMENT.map((eq) => (
                <button
                  key={eq.id}
                  onClick={() => setEquipment(eq.id)}
                  className={`w-full p-5 rounded-xl border-2 text-left transition-all ${
                    equipment === eq.id
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <span className="font-semibold text-lg block">{eq.label}</span>
                  <span className="text-gray-600">{eq.description}</span>
                </button>
              ))}
            </div>

            <h3 className="font-semibold text-lg mb-4">What&apos;s your experience level?</h3>
            <div className="space-y-3">
              {EXPERIENCE.map((exp) => (
                <button
                  key={exp.id}
                  onClick={() => setExperience(exp.id)}
                  className={`w-full p-5 rounded-xl border-2 text-left transition-all ${
                    experience === exp.id
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <span className="font-semibold text-lg block">{exp.label}</span>
                  <span className="text-gray-600">{exp.description}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Workout Days */}
        {step === 4 && (
          <div>
            <h1 className="text-2xl font-bold mb-2">When do you want to work out?</h1>
            <p className="text-gray-600 mb-8">Select the days you&apos;re available. We recommend 3-5 days per week.</p>

            <div className="flex flex-wrap gap-3 mb-8">
              {DAYS.map((day) => (
                <button
                  key={day.id}
                  onClick={() => toggleDay(day.id)}
                  className={`w-16 h-16 rounded-xl border-2 font-semibold transition-all ${
                    workoutDays.includes(day.id)
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  {day.label}
                </button>
              ))}
            </div>

            <h3 className="font-semibold text-lg mb-4">How long should each session be?</h3>
            <div className="flex gap-3">
              {DURATIONS.map((dur) => (
                <button
                  key={dur.id}
                  onClick={() => setSessionLength(dur.id)}
                  className={`flex-1 p-4 rounded-xl border-2 font-semibold transition-all ${
                    sessionLength === dur.id
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  {dur.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 5: Units */}
        {step === 5 && (
          <div>
            <h1 className="text-2xl font-bold mb-2">Almost done!</h1>
            <p className="text-gray-600 mb-8">Just one more preference.</p>

            <h3 className="font-semibold text-lg mb-4">What units do you prefer for weights?</h3>
            <div className="flex gap-4">
              <button
                onClick={() => setUnits('lbs')}
                className={`flex-1 p-6 rounded-xl border-2 font-semibold text-xl transition-all ${
                  units === 'lbs'
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                Pounds (lbs)
              </button>
              <button
                onClick={() => setUnits('kg')}
                className={`flex-1 p-6 rounded-xl border-2 font-semibold text-xl transition-all ${
                  units === 'kg'
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                Kilograms (kg)
              </button>
            </div>

            <div className="mt-12 p-6 bg-blue-50 rounded-xl">
              <h3 className="font-semibold text-lg mb-2">Your Summary</h3>
              <ul className="space-y-2 text-gray-700">
                <li><strong>Goals:</strong> {goals.join(', ') || 'None selected'}</li>
                <li><strong>Limitations:</strong> {limitations.join(', ') || 'None'}</li>
                <li><strong>Equipment:</strong> {equipment || 'Not selected'}</li>
                <li><strong>Experience:</strong> {experience || 'Not selected'}</li>
                <li><strong>Workout Days:</strong> {workoutDays.join(', ') || 'None selected'}</li>
                <li><strong>Session Length:</strong> {sessionLength} minutes</li>
              </ul>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-4 mt-10">
          {step > 1 && (
            <button
              onClick={handleBack}
              className="flex-1 py-4 px-6 bg-gray-200 text-gray-700 rounded-xl font-semibold text-lg hover:bg-gray-300 transition-colors"
            >
              Back
            </button>
          )}
          {step < totalSteps ? (
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className="flex-1 py-4 px-6 bg-blue-600 text-white rounded-xl font-semibold text-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          ) : (
            <button
              onClick={handleComplete}
              disabled={saving}
              className="flex-1 py-4 px-6 bg-green-600 text-white rounded-xl font-semibold text-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Complete Setup'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
