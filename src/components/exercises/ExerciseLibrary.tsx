'use client';

import { useState } from 'react';
import { useExerciseLibrary } from '@/hooks/useExerciseLibrary';
import type { LibraryExercise, NewExercise, ExerciseUpdate } from '@/types/exercise';
import { ExerciseCard } from './ExerciseCard';
import { ExerciseFilters } from './ExerciseFilters';
import { ExerciseDetailModal } from './ExerciseDetailModal';
import { CreateExerciseModal } from './CreateExerciseModal';

interface ExerciseLibraryProps {
  userId: string;
}

export function ExerciseLibrary({ userId }: ExerciseLibraryProps) {
  const {
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
  } = useExerciseLibrary(userId);

  const [selectedExercise, setSelectedExercise] = useState<LibraryExercise | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleExerciseClick = (exercise: LibraryExercise) => {
    setSelectedExercise(exercise);
    setShowDetailModal(true);
  };

  const handleCloseDetailModal = () => {
    setShowDetailModal(false);
    setSelectedExercise(null);
  };

  const handleSaveExercise = async (exerciseId: string, updates: ExerciseUpdate) => {
    await editExercise(exerciseId, updates);
  };

  const handleDeleteExercise = async (exerciseId: string) => {
    await removeExercise(exerciseId);
  };

  const handleCreateExercise = async (exercise: NewExercise): Promise<string> => {
    return await addExercise(exercise);
  };

  // Loading state
  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            {initializing ? (
              <>
                <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-600">Setting up your exercise library...</p>
                <p className="text-sm text-gray-400 mt-1">
                  Adding {exercises.length > 0 ? exercises.length : '75+'} exercises
                </p>
              </>
            ) : (
              <>
                <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-600">Loading exercises...</p>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="text-center py-12">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-gray-900 font-medium mb-1">Failed to load exercises</p>
          <p className="text-gray-500 text-sm mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Exercise Library</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Browse and manage your exercises
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Exercise
          </button>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <ExerciseFilters
            filters={filters}
            onChange={setFilters}
            onClear={clearFilters}
            totalCount={exercises.length}
            filteredCount={filteredExercises.length}
          />
        </div>

        {/* Exercise Grid */}
        {filteredExercises.length === 0 ? (
          <div className="text-center py-12">
            {exercises.length === 0 ? (
              <>
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <p className="text-gray-900 font-medium mb-1">No exercises yet</p>
                <p className="text-gray-500 text-sm mb-4">
                  Start building your exercise library
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Create your first exercise
                </button>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <p className="text-gray-900 font-medium mb-1">No matching exercises</p>
                <p className="text-gray-500 text-sm mb-4">
                  Try adjusting your filters or search term
                </p>
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  Clear filters
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredExercises.map((exercise) => (
              <ExerciseCard
                key={exercise.id}
                exercise={exercise}
                onClick={() => handleExerciseClick(exercise)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <ExerciseDetailModal
        isOpen={showDetailModal}
        onClose={handleCloseDetailModal}
        exercise={selectedExercise}
        onSave={handleSaveExercise}
        onDelete={handleDeleteExercise}
      />

      <CreateExerciseModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSave={handleCreateExercise}
      />
    </>
  );
}
