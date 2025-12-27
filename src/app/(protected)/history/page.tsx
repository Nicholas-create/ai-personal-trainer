'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  getWorkouts,
  getAllPlans,
  renamePlan,
  pausePlan,
  resumePlan,
  archivePlan,
  extendPlan,
  deletePlan,
} from '@/lib/firebase/firestore';
import type { Workout } from '@/types/workout';
import type { WorkoutPlan, DaySchedule } from '@/types/plan';
import { ProgramDetail } from '@/components/programs';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  addMonths,
  subMonths,
  isToday,
  getDay,
  isWithinInterval,
} from 'date-fns';

export default function HistoryPage() {
  const { user } = useAuth();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [plans, setPlans] = useState<WorkoutPlan[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);
  const [showProgramManagement, setShowProgramManagement] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;

    try {
      const [workoutsData, plansData] = await Promise.all([
        getWorkouts(user.uid, 90),
        getAllPlans(user.uid),
      ]);

      setWorkouts(workoutsData);
      setPlans(plansData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getDaysInMonth = () => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  };

  const getWorkoutForDay = (date: Date) => {
    // Find all workouts for this day
    const dayWorkouts = workouts.filter((w) => {
      const workoutDate = w.date instanceof Date ? w.date : new Date(w.date);
      return isSameDay(workoutDate, date);
    });

    if (dayWorkouts.length === 0) return undefined;

    // Prioritize completed workouts over incomplete ones
    const completedWorkout = dayWorkouts.find((w) => w.completed);
    return completedWorkout || dayWorkouts[0];
  };

  const getScheduledWorkoutForDate = (date: Date): DaySchedule | null => {
    const activePlan = plans.find((p) => p.status === 'active');
    if (!activePlan) return null;

    const startDate = activePlan.startedAt || activePlan.generatedAt;
    if (!isWithinInterval(date, { start: startDate, end: activePlan.validUntil })) {
      return null;
    }

    const dayName = format(date, 'EEEE');
    return (
      activePlan.workoutSchedule.find(
        (s) => s.dayOfWeek.toLowerCase() === dayName.toLowerCase()
      ) || null
    );
  };

  const activePlan = plans.find((p) => p.status === 'active');
  const selectedWorkout = getWorkoutForDay(selectedDate);
  const selectedSchedule = getScheduledWorkoutForDate(selectedDate);

  const days = getDaysInMonth();
  const startDayOfWeek = getDay(startOfMonth(currentMonth));
  const adjustedStartDay = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

  // Program action handlers (use activePlan)
  const handleRename = async (name: string) => {
    if (!user || !activePlan) return;
    await renamePlan(user.uid, activePlan.id, name);
    await loadData();
  };

  const handlePause = async () => {
    if (!user || !activePlan) return;
    await pausePlan(user.uid, activePlan.id);
    await loadData();
  };

  const handleResume = async () => {
    if (!user || !activePlan) return;
    await resumePlan(user.uid, activePlan.id);
    await loadData();
  };

  const handleArchive = async () => {
    if (!user || !activePlan) return;
    await archivePlan(user.uid, activePlan.id);
    await loadData();
  };

  const handleExtend = async (weeks: number) => {
    if (!user || !activePlan) return;
    await extendPlan(user.uid, activePlan.id, weeks);
    await loadData();
  };

  const handleDelete = async () => {
    if (!user || !activePlan) return;
    await deletePlan(user.uid, activePlan.id);
    await loadData();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Workout History</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            {/* Month Navigation */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {format(currentMonth, 'MMMM yyyy')}
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setCurrentMonth(new Date());
                    setSelectedDate(new Date());
                  }}
                  className="px-4 py-2 bg-blue-100 text-blue-700 rounded-xl font-medium hover:bg-blue-200 text-base"
                >
                  Today
                </button>
                <button
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  className="w-12 h-12 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-xl"
                >
                  ‹
                </button>
                <button
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  className="w-12 h-12 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-xl"
                >
                  ›
                </button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2">
              {/* Day Headers */}
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                <div
                  key={day}
                  className="text-center text-sm font-semibold text-gray-500 py-2"
                >
                  {day}
                </div>
              ))}

              {/* Empty cells for days before month starts */}
              {Array.from({ length: adjustedStartDay }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}

              {/* Calendar Days */}
              {days.map((day) => {
                const workout = getWorkoutForDay(day);
                const schedule = getScheduledWorkoutForDate(day);
                const isSelected = isSameDay(day, selectedDate);
                const hasCompletedWorkout = !!workout?.completed;
                const hasScheduledWorkout =
                  schedule && schedule.workoutType !== 'rest';
                const isFutureDate =
                  day > new Date() && !isSameDay(day, new Date());
                const showScheduledIndicator =
                  hasScheduledWorkout &&
                  !hasCompletedWorkout &&
                  (isFutureDate || isSameDay(day, new Date()));

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className={`relative aspect-square rounded-xl flex items-center justify-center text-lg font-medium transition-all ${
                      isSelected
                        ? 'bg-blue-600 text-white'
                        : isToday(day)
                        ? 'bg-blue-100 text-blue-700 font-bold'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    {format(day, 'd')}
                    {/* Bottom bar indicator */}
                    {(hasCompletedWorkout || showScheduledIndicator) && (
                      <span
                        className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-6 h-1.5 rounded-full ${
                          hasCompletedWorkout ? 'bg-green-500' : 'bg-blue-400'
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex justify-center gap-6 mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <span className="w-6 h-1.5 rounded-full bg-green-500" />
                <span className="text-sm text-gray-600">Completed</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-1.5 rounded-full bg-blue-400" />
                <span className="text-sm text-gray-600">Scheduled</span>
              </div>
            </div>
          </div>
        </div>

        {/* Details Sidebar */}
        <div className="space-y-6">
          {/* Unified Detail Panel */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            {(() => {
              const isPast =
                selectedDate < new Date() && !isSameDay(selectedDate, new Date());

              // Completed workout (past or today)
              if (selectedWorkout?.completed) {
                return (
                  <>
                    <p className="text-gray-500 text-sm mb-1">
                      {format(selectedDate, 'EEEE, MMMM d')}
                    </p>
                    <div className="flex items-center gap-2 mb-4">
                      <h3 className="text-xl font-bold text-gray-900">
                        {selectedWorkout.name}
                      </h3>
                      <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                        Completed
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600">Duration</span>
                        <span className="font-semibold text-gray-900">
                          {selectedWorkout.duration} minutes
                        </span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600">Exercises</span>
                        <span className="font-semibold text-gray-900">
                          {selectedWorkout.exercises.length} total
                        </span>
                      </div>
                      {selectedWorkout.notes && (
                        <div className="py-2">
                          <span className="text-gray-600 block mb-1">Notes</span>
                          <span className="text-gray-900">
                            {selectedWorkout.notes}
                          </span>
                        </div>
                      )}
                    </div>
                  </>
                );
              }

              // Scheduled workout (future or today without completed workout)
              if (selectedSchedule && selectedSchedule.workoutType !== 'rest') {
                return (
                  <>
                    <p className="text-gray-500 text-sm mb-1">
                      {format(selectedDate, 'EEEE, MMMM d')}
                    </p>
                    <div className="flex items-center gap-2 mb-4">
                      <h3 className="text-xl font-bold text-gray-900">
                        {selectedSchedule.workoutName}
                      </h3>
                      <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                        Scheduled
                      </span>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                        Exercises ({selectedSchedule.exercises.length})
                      </p>
                      {selectedSchedule.exercises.map((exercise) => (
                        <div
                          key={exercise.id}
                          className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
                        >
                          <span className="font-medium text-gray-900">
                            {exercise.name}
                          </span>
                          <span className="text-gray-500">
                            {exercise.sets} x {exercise.reps}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                );
              }

              // Rest day
              if (selectedSchedule?.workoutType === 'rest') {
                return (
                  <div className="text-center py-8">
                    <p className="text-4xl mb-4">Rest Day</p>
                    <p className="text-lg font-semibold text-gray-900 mb-2">
                      {format(selectedDate, 'EEEE, MMMM d')}
                    </p>
                    <p className="text-gray-600">
                      Recovery is just as important as training. Take it easy!
                    </p>
                  </div>
                );
              }

              // Past day with no workout
              if (isPast) {
                return (
                  <div className="text-center text-gray-500 py-8">
                    <p className="text-lg mb-2">
                      {format(selectedDate, 'MMMM d, yyyy')}
                    </p>
                    <p>No workout recorded for this day</p>
                  </div>
                );
              }

              // No active program for this date
              return (
                <div className="text-center text-gray-500 py-8">
                  <p className="text-lg mb-2">
                    {format(selectedDate, 'MMMM d, yyyy')}
                  </p>
                  <p>No active program for this date</p>
                </div>
              );
            })()}
          </div>

          {/* Active Program Management (Collapsible) */}
          {activePlan && (
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <button
                onClick={() => setShowProgramManagement(!showProgramManagement)}
                className="w-full p-4 flex items-center justify-between text-left"
              >
                <div>
                  <h3 className="font-semibold text-gray-900">Active Program</h3>
                  <p className="text-sm text-gray-500">{activePlan.name}</p>
                </div>
                <svg
                  className={`w-5 h-5 text-gray-400 transition-transform ${
                    showProgramManagement ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {showProgramManagement && (
                <div className="border-t border-gray-100">
                  <ProgramDetail
                    plan={activePlan}
                    onRename={handleRename}
                    onPause={handlePause}
                    onResume={handleResume}
                    onArchive={handleArchive}
                    onExtend={handleExtend}
                    onDelete={handleDelete}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
