'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getWorkouts } from '@/lib/firebase/firestore';
import type { Workout } from '@/types/workout';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isToday,
  getDay,
} from 'date-fns';

export default function HistoryPage() {
  const { user } = useAuth();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadWorkouts() {
      if (!user) return;

      try {
        const data = await getWorkouts(user.uid, 90);
        setWorkouts(data);
      } catch (error) {
        console.error('Error loading workouts:', error);
      } finally {
        setLoading(false);
      }
    }

    loadWorkouts();
  }, [user]);

  const getDaysInMonth = () => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  };

  const getWorkoutForDay = (date: Date) => {
    return workouts.find((w) => isSameDay(new Date(w.date), date));
  };

  const selectedWorkout = selectedDate ? getWorkoutForDay(selectedDate) : null;

  // Calculate stats for current month
  const monthWorkouts = workouts.filter((w) =>
    isSameMonth(new Date(w.date), currentMonth)
  );
  const completedWorkouts = monthWorkouts.filter((w) => w.completed);
  const totalTime = monthWorkouts.reduce((acc, w) => acc + (w.duration || 0), 0);

  // Calculate streak
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < workouts.length; i++) {
    const workoutDate = new Date(workouts[i].date);
    const expectedDate = new Date(today);
    expectedDate.setDate(today.getDate() - i);

    if (isSameDay(workoutDate, expectedDate) && workouts[i].completed) {
      streak++;
    } else {
      break;
    }
  }

  const days = getDaysInMonth();
  const startDayOfWeek = getDay(startOfMonth(currentMonth));
  // Adjust for Monday start (0 = Monday, 6 = Sunday)
  const adjustedStartDay = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Workout History</h1>

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
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  className="w-11 h-11 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-lg"
                >
                  ‹
                </button>
                <button
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  className="w-11 h-11 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-lg"
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
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const hasWorkout = !!workout?.completed;

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className={`aspect-square rounded-xl flex items-center justify-center text-lg font-medium transition-all ${
                      isSelected
                        ? 'bg-blue-600 text-white'
                        : isToday(day)
                        ? 'border-2 border-blue-600 text-blue-600'
                        : hasWorkout
                        ? 'bg-green-100 text-green-600'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    {format(day, 'd')}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Stats & Details */}
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl p-5 shadow-sm text-center">
              <p className="text-3xl font-bold text-gray-900">
                {completedWorkouts.length}
              </p>
              <p className="text-gray-500 text-sm">Workouts</p>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm text-center">
              <p className="text-3xl font-bold text-gray-900">
                {Math.round(totalTime / 60)}h
              </p>
              <p className="text-gray-500 text-sm">Total Time</p>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm text-center">
              <p className="text-3xl font-bold text-gray-900">{streak}</p>
              <p className="text-gray-500 text-sm">Day Streak</p>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm text-center">
              <p className="text-3xl font-bold text-gray-900">
                {completedWorkouts.length > 0
                  ? Math.round(
                      (completedWorkouts.reduce(
                        (acc, w) =>
                          acc +
                          w.exercises.filter(
                            (e) =>
                              e.completedSets.filter((s) => s.completed).length > 0
                          ).length /
                            w.exercises.length,
                        0
                      ) /
                        completedWorkouts.length) *
                        100
                    )
                  : 0}
                %
              </p>
              <p className="text-gray-500 text-sm">Completion</p>
            </div>
          </div>

          {/* Selected Workout Details */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            {selectedWorkout ? (
              <>
                <p className="text-gray-500 text-sm mb-1">
                  {format(new Date(selectedWorkout.date), 'EEEE, MMMM d')}
                </p>
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  {selectedWorkout.name}
                </h3>

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
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Completed</span>
                    <span className="font-semibold text-gray-900">
                      {selectedWorkout.completed ? 'Yes' : 'No'}
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
            ) : selectedDate ? (
              <div className="text-center text-gray-500 py-8">
                <p className="text-lg mb-2">
                  {format(selectedDate, 'MMMM d, yyyy')}
                </p>
                <p>No workout recorded for this day</p>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <p>Select a day to see workout details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
