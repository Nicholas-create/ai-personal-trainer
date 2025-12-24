'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getActivePlan, createWorkout, updateWorkout } from '@/lib/firebase/firestore';
import type { WorkoutPlan, PlanExercise } from '@/types/plan';
import type { Exercise, Workout, CompletedSet } from '@/types/workout';
import { format } from 'date-fns';
import Stepper from '@/components/ui/Stepper';
import WeightChips from '@/components/ui/WeightChips';

export default function WorkoutPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const [todayExercises, setTodayExercises] = useState<PlanExercise[]>([]);
  const [workoutName, setWorkoutName] = useState('');
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [workoutId, setWorkoutId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [startTime] = useState(new Date());

  useEffect(() => {
    async function loadPlan() {
      if (!user) return;

      try {
        const activePlan = await getActivePlan(user.uid);
        setPlan(activePlan);

        if (activePlan) {
          const today = format(new Date(), 'EEEE').toLowerCase();
          const todaySchedule = activePlan.workoutSchedule.find(
            (s) => s.dayOfWeek.toLowerCase() === today
          );

          if (todaySchedule && todaySchedule.workoutType !== 'rest') {
            setTodayExercises(todaySchedule.exercises);
            setWorkoutName(todaySchedule.workoutName);

            // Initialize exercise tracking
            const initialExercises: Exercise[] = todaySchedule.exercises.map(
              (e) => ({
                id: e.id,
                name: e.name,
                targetSets: e.sets,
                targetReps: e.reps,
                completedSets: Array(e.sets)
                  .fill(null)
                  .map(() => ({
                    reps: e.reps,
                    weight: 0,
                    completed: false,
                  })),
                skipped: false,
                notes: e.notes,
              })
            );
            setExercises(initialExercises);

            // Create workout record
            const id = await createWorkout(user.uid, {
              date: new Date(),
              planId: activePlan.id,
              name: todaySchedule.workoutName,
              exercises: initialExercises,
              completed: false,
              duration: 0,
            });
            setWorkoutId(id);
          }
        }
      } catch (error) {
        console.error('Error loading plan:', error);
      } finally {
        setLoading(false);
      }
    }

    loadPlan();
  }, [user]);

  const currentExercise = exercises[currentExerciseIndex];
  const currentSetIndex = currentExercise?.completedSets.findIndex(
    (s) => !s.completed
  );

  const updateSet = (setIndex: number, updates: Partial<CompletedSet>) => {
    setExercises((prev) => {
      const newExercises = [...prev];
      const exercise = { ...newExercises[currentExerciseIndex] };
      exercise.completedSets = [...exercise.completedSets];
      exercise.completedSets[setIndex] = {
        ...exercise.completedSets[setIndex],
        ...updates,
      };
      newExercises[currentExerciseIndex] = exercise;
      return newExercises;
    });
  };

  const completeSet = async (setIndex: number) => {
    updateSet(setIndex, { completed: true });

    // Save to Firestore
    if (workoutId && user) {
      const updatedExercises = [...exercises];
      updatedExercises[currentExerciseIndex].completedSets[setIndex].completed =
        true;

      try {
        setSaving(true);
        await updateWorkout(user.uid, workoutId, {
          exercises: updatedExercises,
        });
      } catch (error) {
        console.error('Error saving set:', error);
      } finally {
        setSaving(false);
      }
    }
  };

  const nextExercise = () => {
    if (currentExerciseIndex < exercises.length - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
    }
  };

  const prevExercise = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(currentExerciseIndex - 1);
    }
  };

  const finishWorkout = async () => {
    if (!workoutId || !user) return;

    const duration = Math.round(
      (new Date().getTime() - startTime.getTime()) / 60000
    );

    try {
      setSaving(true);
      await updateWorkout(user.uid, workoutId, {
        completed: true,
        duration,
        exercises,
      });
      router.push('/dashboard');
    } catch (error) {
      console.error('Error finishing workout:', error);
    } finally {
      setSaving(false);
    }
  };

  const completedExercises = exercises.filter(
    (e) => e.completedSets.every((s) => s.completed) || e.skipped
  ).length;
  const progressPercent = (completedExercises / exercises.length) * 100;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  if (!plan || todayExercises.length === 0) {
    return (
      <div className="p-6 lg:p-8 max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
          <span className="text-6xl mb-4 block">📅</span>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            No Workout Scheduled
          </h2>
          <p className="text-gray-600 mb-6">
            You don&apos;t have a workout scheduled for today. It might be a rest day,
            or you need to generate a plan.
          </p>
          <button
            onClick={() => router.push('/coach')}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            Talk to AI Coach
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Progress Header */}
      <div className="bg-white border-b border-gray-200 p-4 lg:p-6 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-gray-500 hover:text-gray-700 text-lg"
            >
              ← Exit
            </button>
            <h2 className="font-bold text-lg">{workoutName}</h2>
            <span className="text-gray-500">
              {saving ? 'Saving...' : ''}
            </span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Exercise {currentExerciseIndex + 1} of {exercises.length}
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 lg:p-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Exercise List (Sidebar) */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold text-lg mb-4">Today&apos;s Exercises</h3>
              <div className="space-y-2">
                {exercises.map((exercise, index) => {
                  const isComplete = exercise.completedSets.every(
                    (s) => s.completed
                  );
                  const isCurrent = index === currentExerciseIndex;

                  return (
                    <button
                      key={exercise.id}
                      onClick={() => setCurrentExerciseIndex(index)}
                      className={`w-full flex items-center gap-3 p-4 rounded-xl text-left transition-all ${
                        isCurrent
                          ? 'bg-blue-100 border-2 border-blue-600'
                          : isComplete
                          ? 'bg-green-50'
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          isComplete
                            ? 'bg-green-600 text-white'
                            : isCurrent
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-300 text-gray-600'
                        }`}
                      >
                        {isComplete ? '✓' : index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{exercise.name}</p>
                        <p className="text-sm text-gray-500">
                          {exercise.targetSets} sets × {exercise.targetReps} reps
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Current Exercise */}
          <div className="lg:col-span-2 order-1 lg:order-2">
            {currentExercise && (
              <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-sm">
                <div className="mb-6">
                  <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                    {currentExercise.name}
                  </h2>
                  <p className="text-blue-600 text-lg">
                    Target: {currentExercise.targetSets} sets ×{' '}
                    {currentExercise.targetReps} reps
                  </p>
                </div>

                {/* Sets */}
                <div className="space-y-4">
                  <h3 className="font-bold text-lg">Log Your Sets</h3>

                  {currentExercise.completedSets.map((set, index) => (
                    <div
                      key={index}
                      className={`p-5 rounded-xl ${
                        set.completed
                          ? 'bg-green-50'
                          : index === currentSetIndex
                          ? 'bg-gray-50'
                          : 'bg-gray-50 opacity-60'
                      }`}
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                        <div className="font-bold text-lg min-w-[60px]">
                          Set {index + 1}
                        </div>

                        <div className="flex-1 grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs font-semibold text-gray-500 block mb-2">
                              REPS
                            </label>
                            <Stepper
                              value={set.reps}
                              onChange={(value) =>
                                updateSet(index, { reps: value })
                              }
                              min={0}
                              max={50}
                              disabled={set.completed}
                            />
                          </div>

                          <div>
                            <label className="text-xs font-semibold text-gray-500 block mb-2">
                              WEIGHT ({user?.profile?.units || 'lbs'})
                            </label>
                            <WeightChips
                              value={set.weight}
                              onChange={(value) =>
                                updateSet(index, { weight: value })
                              }
                              disabled={set.completed}
                            />
                          </div>
                        </div>

                        <button
                          onClick={() => completeSet(index)}
                          disabled={set.completed || saving}
                          className={`px-6 py-3 rounded-xl font-semibold transition-colors min-w-[140px] ${
                            set.completed
                              ? 'bg-green-600 text-white'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          } disabled:opacity-50`}
                        >
                          {set.completed ? '✓ Done' : 'Complete Set'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Navigation */}
                <div className="flex gap-4 mt-8">
                  <button
                    onClick={prevExercise}
                    disabled={currentExerciseIndex === 0}
                    className="flex-1 py-4 px-6 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors disabled:opacity-50"
                  >
                    Previous
                  </button>
                  {currentExerciseIndex === exercises.length - 1 ? (
                    <button
                      onClick={finishWorkout}
                      disabled={saving}
                      className="flex-1 py-4 px-6 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : 'Finish Workout'}
                    </button>
                  ) : (
                    <button
                      onClick={nextExercise}
                      className="flex-1 py-4 px-6 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                    >
                      Next Exercise
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
