import { useState, useCallback } from 'react';
import { createPlan, getActivePlan } from '@/lib/firebase/firestore';
import { withRetry } from '@/lib/firebase/firestoreRetry';
import { logger } from '@/lib/logger';
import type { WorkoutPlan, DaySchedule } from '@/types/plan';

interface UsePlanManagementProps {
  userId: string | undefined;
  onPlanCreated?: (plan: WorkoutPlan) => void;
}

interface UsePlanManagementReturn {
  activePlan: WorkoutPlan | null;
  setActivePlan: (plan: WorkoutPlan | null) => void;
  isCreatingPlan: boolean;
  createNewPlan: (schedule: DaySchedule[], name?: string) => Promise<boolean>;
  loadActivePlan: () => Promise<void>;
  error: string | null;
}

/**
 * Hook for managing workout plans
 * Centralizes plan creation logic with retry and error handling
 */
export function usePlanManagement({
  userId,
  onPlanCreated,
}: UsePlanManagementProps): UsePlanManagementReturn {
  const [activePlan, setActivePlan] = useState<WorkoutPlan | null>(null);
  const [isCreatingPlan, setIsCreatingPlan] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load the user's active plan
   */
  const loadActivePlan = useCallback(async () => {
    if (!userId) return;

    try {
      const plan = await getActivePlan(userId);
      setActivePlan(plan);
    } catch (err) {
      logger.error('Error loading active plan:', err);
      setError('Failed to load your workout plan.');
    }
  }, [userId]);

  /**
   * Create a new workout plan
   * @param schedule - The workout schedule for the plan
   * @param name - Optional custom name for the plan
   * @returns true if successful, false otherwise
   */
  const createNewPlan = useCallback(
    async (schedule: DaySchedule[], name?: string): Promise<boolean> => {
      if (!userId) {
        setError('User not authenticated');
        return false;
      }

      try {
        setIsCreatingPlan(true);
        setError(null);

        const now = new Date();
        const defaultName = `Program - ${now.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })}`;

        // Calculate validity (30 days from now)
        const validUntil = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

        await withRetry(() =>
          createPlan(userId, {
            generatedAt: now,
            generatedBy: 'claude',
            active: true,
            workoutSchedule: schedule,
            validUntil,
            name: name || defaultName,
            status: 'active',
          })
        );

        // Reload the active plan to get the full document with ID
        const newPlan = await getActivePlan(userId);
        setActivePlan(newPlan);

        if (newPlan && onPlanCreated) {
          onPlanCreated(newPlan);
        }

        return true;
      } catch (err) {
        logger.error('Error creating plan:', err);
        setError('Failed to create workout plan. Please try again.');
        return false;
      } finally {
        setIsCreatingPlan(false);
      }
    },
    [userId, onPlanCreated]
  );

  return {
    activePlan,
    setActivePlan,
    isCreatingPlan,
    createNewPlan,
    loadActivePlan,
    error,
  };
}
