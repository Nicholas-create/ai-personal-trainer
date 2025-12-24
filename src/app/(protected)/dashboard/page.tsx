'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { getActivePlan, getWorkouts } from '@/lib/firebase/firestore';
import type { WorkoutPlan, TodayWorkout } from '@/types/plan';
import type { Workout } from '@/types/workout';
import { format, startOfWeek, addDays, isToday, isSameDay } from 'date-fns';

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function DashboardPage() {
  const { user } = useAuth();
  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const [recentWorkouts, setRecentWorkouts] = useState<Workout[]>([]);
  const [todayWorkout, setTodayWorkout] = useState<TodayWorkout | null>(null);
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    async function loadData() {
      if (!user) return;

      try {
        const [activePlan, workouts] = await Promise.all([
          getActivePlan(user.uid),
          getWorkouts(user.uid, 30),
        ]);

        setPlan(activePlan);
        setRecentWorkouts(workouts);

        // Calculate streak
        let currentStreak = 0;
        const today = new Date();
        for (let i = 0; i < workouts.length; i++) {
          const workoutDate = new Date(workouts[i].date);
          const expectedDate = new Date(today);
          expectedDate.setDate(today.getDate() - i);

          if (isSameDay(workoutDate, expectedDate) && workouts[i].completed) {
            currentStreak++;
          } else {
            break;
          }
        }
        setStreak(currentStreak);

        // Get today's workout from the plan
        if (activePlan) {
          const today = format(new Date(), 'EEEE').toLowerCase();
          const todaySchedule = activePlan.workoutSchedule.find(
            (s) => s.dayOfWeek.toLowerCase() === today
          );

          if (todaySchedule) {
            setTodayWorkout({
              name: todaySchedule.workoutName,
              exercises: todaySchedule.exercises,
              estimatedDuration: user.profile?.sessionLength || 45,
              isRestDay: todaySchedule.workoutType === 'rest',
            });
          }
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getWeekDays = () => {
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }); // Monday
    return DAYS_OF_WEEK.map((day, index) => {
      const date = addDays(weekStart, index);
      const daySchedule = plan?.workoutSchedule.find(
        (s) => s.dayOfWeek.toLowerCase() === format(date, 'EEEE').toLowerCase()
      );
      const completedWorkout = recentWorkouts.find(
        (w) => isSameDay(new Date(w.date), date) && w.completed
      );

      return {
        name: day,
        date: format(date, 'd'),
        isToday: isToday(date),
        isRest: daySchedule?.workoutType === 'rest',
        isCompleted: !!completedWorkout,
        workoutType: daySchedule?.workoutName || '',
      };
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  const firstName = user?.displayName?.split(' ')[0] || 'there';

  return (
    <div className="p-6 lg:p-6 lg:py-4 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6 lg:mb-4">
        <p className="text-gray-500 text-lg">{getGreeting()},</p>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {firstName}
        </h1>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-4 lg:gap-5 mb-6 lg:mb-4">
        {/* Today's Workout Card */}
        <div className="lg:col-span-2">
          {todayWorkout && !todayWorkout.isRestDay ? (
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 lg:p-6 text-white h-full">
              <p className="text-blue-200 text-sm font-medium mb-1">
                TODAY&apos;S WORKOUT
              </p>
              <h2 className="text-2xl font-bold mb-4">{todayWorkout.name}</h2>

              <div className="flex gap-6 mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🏋️</span>
                  <span>{todayWorkout.exercises.length} exercises</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">⏱️</span>
                  <span>~{todayWorkout.estimatedDuration} min</span>
                </div>
              </div>

              <Link
                href="/workout"
                className="inline-flex items-center justify-center w-full lg:w-auto px-6 py-3 bg-white text-blue-600 rounded-xl font-bold hover:bg-blue-50 transition-colors"
              >
                Start Workout
              </Link>
            </div>
          ) : todayWorkout?.isRestDay ? (
            <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl p-6 text-white h-full">
              <p className="text-amber-200 text-sm font-medium mb-1">TODAY</p>
              <h2 className="text-2xl font-bold mb-3">Rest Day</h2>
              <p className="text-amber-100 mb-4">
                Recovery is just as important as training. Take it easy today!
              </p>
              <Link
                href="/coach"
                className="inline-flex items-center justify-center px-5 py-2.5 bg-white/20 text-white rounded-xl font-semibold hover:bg-white/30 transition-colors"
              >
                Chat with AI Coach
              </Link>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-gray-600 to-gray-700 rounded-2xl p-6 text-white h-full">
              <h2 className="text-2xl font-bold mb-3">No Plan Yet</h2>
              <p className="text-gray-300 mb-4">
                Let&apos;s create your first personalized workout plan!
              </p>
              <Link
                href="/coach"
                className="inline-flex items-center justify-center px-6 py-3 bg-white text-gray-700 rounded-xl font-bold hover:bg-gray-100 transition-colors"
              >
                Create My Plan
              </Link>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="space-y-3 lg:space-y-2">
          <div className="bg-white rounded-2xl p-6 lg:p-4 shadow-sm flex items-center gap-4 lg:gap-3">
            <div className="w-14 h-14 lg:w-12 lg:h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <span className="text-3xl lg:text-2xl">🔥</span>
            </div>
            <div>
              <p className="text-3xl lg:text-2xl font-bold text-gray-900">{streak} days</p>
              <p className="text-gray-500 text-sm">Current Streak</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 lg:p-4 shadow-sm flex items-center gap-4 lg:gap-3">
            <div className="w-14 h-14 lg:w-12 lg:h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <span className="text-3xl lg:text-2xl">📈</span>
            </div>
            <div>
              <p className="text-3xl lg:text-2xl font-bold text-gray-900">
                {recentWorkouts.filter((w) => w.completed).length}
              </p>
              <p className="text-gray-500 text-sm">Workouts This Month</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 lg:p-4 shadow-sm flex items-center gap-4 lg:gap-3">
            <div className="w-14 h-14 lg:w-12 lg:h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <span className="text-3xl lg:text-2xl">⏱️</span>
            </div>
            <div>
              <p className="text-3xl lg:text-2xl font-bold text-gray-900">
                {Math.round(
                  recentWorkouts.reduce((acc, w) => acc + (w.duration || 0), 0) / 60
                )}h
              </p>
              <p className="text-gray-500 text-sm">Total This Month</p>
            </div>
          </div>
        </div>
      </div>

      {/* This Week's Plan */}
      <div className="mb-4 lg:mb-3">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-bold text-gray-900">This Week&apos;s Plan</h2>
          <Link href="/history" className="text-blue-600 hover:text-blue-700 text-sm">
            View full schedule →
          </Link>
        </div>

        <div className="bg-white rounded-2xl p-4 lg:p-4 shadow-sm">
          <div className="grid grid-cols-7 gap-2">
            {getWeekDays().map((day) => (
              <div key={day.name} className="text-center">
                <p className="text-xs text-gray-500 mb-1">{day.name}</p>
                <div
                  className={`w-10 h-10 lg:w-9 lg:h-9 mx-auto rounded-full flex items-center justify-center text-sm font-semibold mb-1 ${
                    day.isToday
                      ? 'bg-blue-600 text-white'
                      : day.isCompleted
                      ? 'bg-green-100 text-green-600'
                      : day.isRest
                      ? 'bg-amber-100 text-amber-600'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {day.isCompleted ? '✓' : day.isRest ? 'R' : day.date}
                </div>
                <p className="text-xs text-gray-500 truncate">
                  {day.isRest ? 'Rest' : day.workoutType || '—'}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Link
          href="/coach"
          className="bg-white rounded-xl p-4 lg:p-3 shadow-sm hover:shadow-md transition-shadow text-center"
        >
          <span className="text-2xl mb-1 block">💬</span>
          <span className="font-semibold text-gray-900 text-sm">Ask AI Coach</span>
        </Link>
        <Link
          href="/history"
          className="bg-white rounded-xl p-4 lg:p-3 shadow-sm hover:shadow-md transition-shadow text-center"
        >
          <span className="text-2xl mb-1 block">📅</span>
          <span className="font-semibold text-gray-900 text-sm">View History</span>
        </Link>
        <Link
          href="/profile"
          className="bg-white rounded-xl p-4 lg:p-3 shadow-sm hover:shadow-md transition-shadow text-center"
        >
          <span className="text-2xl mb-1 block">⚙️</span>
          <span className="font-semibold text-gray-900 text-sm">Settings</span>
        </Link>
        <Link
          href="/workout"
          className="bg-white rounded-xl p-4 lg:p-3 shadow-sm hover:shadow-md transition-shadow text-center"
        >
          <span className="text-2xl mb-1 block">🏋️</span>
          <span className="font-semibold text-gray-900 text-sm">Quick Workout</span>
        </Link>
      </div>
    </div>
  );
}
