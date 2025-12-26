'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  getAllPlans,
  renamePlan,
  pausePlan,
  resumePlan,
  archivePlan,
  extendPlan,
  deletePlan,
  updateDayInPlan,
} from '@/lib/firebase/firestore';
import type { WorkoutPlan, DaySchedule } from '@/types/plan';
import { ProgramList, ProgramDetail } from '@/components/programs';

export default function ProgramsPage() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<WorkoutPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<WorkoutPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const selectedPlanIdRef = useRef<string | null>(null);
  const hasInitiallyLoaded = useRef(false);

  const loadData = useCallback(async (autoSelectOnEmpty = false) => {
    if (!user) return;

    try {
      const plansData = await getAllPlans(user.uid);
      setPlans(plansData);

      // Only auto-select on initial load, not when user manually cleared selection
      if (autoSelectOnEmpty && !selectedPlanIdRef.current) {
        const activePlan = plansData.find((p) => p.status === 'active');
        const planToSelect = activePlan || plansData[0] || null;
        setSelectedPlan(planToSelect);
        selectedPlanIdRef.current = planToSelect?.id || null;
      } else if (selectedPlanIdRef.current) {
        // Refresh selected plan data if one is selected
        const updatedPlan = plansData.find((p) => p.id === selectedPlanIdRef.current);
        setSelectedPlan(updatedPlan || null);
        if (!updatedPlan) {
          selectedPlanIdRef.current = null;
        }
      }
    } catch (error) {
      console.error('Error loading plans:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!hasInitiallyLoaded.current) {
      hasInitiallyLoaded.current = true;
      loadData(true); // Auto-select on initial load
    }
  }, [loadData]);

  const handleSelectPlan = (plan: WorkoutPlan) => {
    setSelectedPlan(plan);
    selectedPlanIdRef.current = plan.id;
  };

  const handleRename = async (name: string) => {
    if (!user || !selectedPlan) return;
    await renamePlan(user.uid, selectedPlan.id, name);
    await loadData();
  };

  const handlePause = async () => {
    if (!user || !selectedPlan) return;
    await pausePlan(user.uid, selectedPlan.id);
    await loadData();
  };

  const handleResume = async () => {
    if (!user || !selectedPlan) return;
    await resumePlan(user.uid, selectedPlan.id);
    await loadData();
  };

  const handleArchive = async () => {
    if (!user || !selectedPlan) return;
    await archivePlan(user.uid, selectedPlan.id);
    await loadData();
  };

  const handleExtend = async (weeks: number) => {
    if (!user || !selectedPlan) return;
    await extendPlan(user.uid, selectedPlan.id, weeks);
    await loadData();
  };

  const handleDelete = async () => {
    if (!user || !selectedPlan) return;
    await deletePlan(user.uid, selectedPlan.id);
    setSelectedPlan(null);
    selectedPlanIdRef.current = null;
    await loadData();
  };

  const handleDayUpdate = async (dayOfWeek: string, updates: Partial<DaySchedule>) => {
    if (!user || !selectedPlan) return;
    await updateDayInPlan(user.uid, selectedPlan.id, dayOfWeek, updates);
    await loadData();
  };

  const handleCloseDetail = () => {
    setSelectedPlan(null);
    selectedPlanIdRef.current = null;
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
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Programs</h1>

      {plans.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
          <p className="text-gray-500 mb-4">No programs yet</p>
          <p className="text-sm text-gray-400 mb-6">
            Create your first program by talking to the AI Coach
          </p>
          <a
            href="/coach"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
          >
            Go to AI Coach
          </a>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Program List - Desktop: always visible, Mobile: visible when no selection */}
          <div className={`lg:col-span-1 ${selectedPlan ? 'hidden lg:block' : ''}`}>
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                All Programs ({plans.length})
              </h2>
              <ProgramList
                plans={plans}
                selectedPlan={selectedPlan}
                onSelectPlan={handleSelectPlan}
              />
            </div>
          </div>

          {/* Program Detail - Desktop: always visible, Mobile: visible when selected */}
          <div className={`lg:col-span-2 ${!selectedPlan ? 'hidden lg:block' : ''}`}>
            {selectedPlan ? (
              <div className="relative">
                {/* Mobile back button */}
                <button
                  onClick={handleCloseDetail}
                  className="lg:hidden flex items-center gap-2 text-gray-600 mb-4 hover:text-gray-900"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                  Back to list
                </button>

                <ProgramDetail
                  plan={selectedPlan}
                  onRename={handleRename}
                  onPause={handlePause}
                  onResume={handleResume}
                  onArchive={handleArchive}
                  onExtend={handleExtend}
                  onDelete={handleDelete}
                  onDayUpdate={handleDayUpdate}
                />
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
                <p className="text-gray-500">Select a program to view details</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
