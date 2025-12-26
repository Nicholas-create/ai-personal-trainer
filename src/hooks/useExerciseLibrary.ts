'use client';

import { useState, useEffect, useCallback } from 'react';
import type {
  LibraryExercise,
  NewExercise,
  ExerciseUpdate,
  ExerciseFilters,
} from '@/types/exercise';
import {
  getExerciseLibrary,
  createExercise,
  updateExercise,
  deleteExercise,
  initializeExerciseLibrary,
  hasExerciseLibrary,
} from '@/lib/firebase/firestore';

interface UseExerciseLibraryReturn {
  // State
  exercises: LibraryExercise[];
  filteredExercises: LibraryExercise[];
  loading: boolean;
  initializing: boolean;
  error: string | null;
  filters: ExerciseFilters;

  // Filter actions
  setFilters: (filters: ExerciseFilters) => void;
  clearFilters: () => void;

  // CRUD actions
  addExercise: (exercise: NewExercise) => Promise<string>;
  editExercise: (exerciseId: string, updates: ExerciseUpdate) => Promise<void>;
  removeExercise: (exerciseId: string) => Promise<void>;

  // Refresh
  refreshLibrary: () => Promise<void>;
}

export function useExerciseLibrary(userId: string | undefined): UseExerciseLibraryReturn {
  const [exercises, setExercises] = useState<LibraryExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<ExerciseFilters>({});

  // Filter exercises based on current filters
  const filteredExercises = exercises.filter((exercise) => {
    // Filter by muscle group
    if (filters.muscleGroup) {
      const hasMuscle =
        exercise.primaryMuscles.includes(filters.muscleGroup) ||
        exercise.secondaryMuscles?.includes(filters.muscleGroup);
      if (!hasMuscle) return false;
    }

    // Filter by equipment
    if (filters.equipment) {
      if (!exercise.equipmentRequired.includes(filters.equipment)) return false;
    }

    // Filter by difficulty
    if (filters.difficulty) {
      if (exercise.difficulty !== filters.difficulty) return false;
    }

    // Filter by search term (name)
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      if (!exercise.name.toLowerCase().includes(term)) return false;
    }

    return true;
  });

  // Load library on mount
  const loadLibrary = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // First try to load existing exercises
      let allExercises = await getExerciseLibrary(userId);

      // If no exercises exist, initialize the library
      if (allExercises.length === 0) {
        setInitializing(true);
        try {
          await initializeExerciseLibrary(userId);
          // Reload after initialization
          allExercises = await getExerciseLibrary(userId);
        } catch (initError) {
          console.error('Error initializing library:', initError);
          // Continue with empty library - user can add exercises manually
        }
        setInitializing(false);
      }

      setExercises(allExercises);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Error loading exercise library:', err);
      setError(`Failed to load exercise library: ${errorMessage}`);
      setExercises([]);
    } finally {
      setLoading(false);
      setInitializing(false);
    }
  }, [userId]);

  useEffect(() => {
    loadLibrary();
  }, [loadLibrary]);

  // Set filters
  const setFilters = useCallback((newFilters: ExerciseFilters) => {
    setFiltersState(newFilters);
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFiltersState({});
  }, []);

  // Add a new exercise
  const addExercise = useCallback(
    async (exercise: NewExercise): Promise<string> => {
      if (!userId) throw new Error('User not authenticated');

      try {
        const exerciseId = await createExercise(userId, exercise);

        // Refresh library to get the new exercise with server timestamp
        await loadLibrary();

        return exerciseId;
      } catch (err) {
        console.error('Error creating exercise:', err);
        throw err;
      }
    },
    [userId, loadLibrary]
  );

  // Edit an existing exercise
  const editExercise = useCallback(
    async (exerciseId: string, updates: ExerciseUpdate): Promise<void> => {
      if (!userId) throw new Error('User not authenticated');

      try {
        await updateExercise(userId, exerciseId, updates);

        // Update local state optimistically
        setExercises((prev) =>
          prev.map((ex) =>
            ex.id === exerciseId
              ? { ...ex, ...updates, updatedAt: new Date() }
              : ex
          )
        );
      } catch (err) {
        console.error('Error updating exercise:', err);
        // Refresh on error to restore correct state
        await loadLibrary();
        throw err;
      }
    },
    [userId, loadLibrary]
  );

  // Remove an exercise
  const removeExercise = useCallback(
    async (exerciseId: string): Promise<void> => {
      if (!userId) throw new Error('User not authenticated');

      try {
        await deleteExercise(userId, exerciseId);

        // Update local state
        setExercises((prev) => prev.filter((ex) => ex.id !== exerciseId));
      } catch (err) {
        console.error('Error deleting exercise:', err);
        throw err;
      }
    },
    [userId]
  );

  // Manual refresh
  const refreshLibrary = useCallback(async () => {
    await loadLibrary();
  }, [loadLibrary]);

  return {
    exercises,
    filteredExercises,
    loading,
    initializing,
    error,
    filters,
    setFilters,
    clearFilters,
    addExercise,
    editExercise,
    removeExercise,
    refreshLibrary,
  };
}
