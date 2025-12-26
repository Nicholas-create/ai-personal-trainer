'use client';

import { useState } from 'react';
import type { PlanExercise } from '@/types/plan';

interface ExerciseEditorProps {
  exercises: PlanExercise[];
  isEditing: boolean;
  onChange: (exercises: PlanExercise[]) => void;
}

export function ExerciseEditor({ exercises, isEditing, onChange }: ExerciseEditorProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // New exercise form state
  const [newExercise, setNewExercise] = useState({
    name: '',
    sets: 3,
    reps: 10,
    notes: '',
  });

  const handleUpdateExercise = (id: string, updates: Partial<PlanExercise>) => {
    onChange(
      exercises.map((ex) => (ex.id === id ? { ...ex, ...updates } : ex))
    );
  };

  const handleRemoveExercise = (id: string) => {
    onChange(exercises.filter((ex) => ex.id !== id));
    setConfirmDeleteId(null);
  };

  const handleMoveExercise = (id: string, direction: 'up' | 'down') => {
    const index = exercises.findIndex((ex) => ex.id === id);
    if (index === -1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= exercises.length) return;

    const newExercises = [...exercises];
    [newExercises[index], newExercises[newIndex]] = [newExercises[newIndex], newExercises[index]];
    onChange(newExercises);
  };

  const handleAddExercise = () => {
    if (!newExercise.name.trim()) return;

    const exercise: PlanExercise = {
      id: `ex-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: newExercise.name.trim(),
      sets: newExercise.sets,
      reps: newExercise.reps,
      notes: newExercise.notes.trim() || undefined,
    };

    onChange([...exercises, exercise]);
    setNewExercise({ name: '', sets: 3, reps: 10, notes: '' });
    setShowAddForm(false);
  };

  if (!isEditing) {
    // View mode
    return (
      <div className="space-y-2">
        {exercises.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No exercises</p>
        ) : (
          exercises.map((exercise) => (
            <div
              key={exercise.id}
              className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
            >
              <div>
                <span className="font-medium text-gray-900">{exercise.name}</span>
                {exercise.notes && (
                  <p className="text-xs text-gray-500 mt-0.5">{exercise.notes}</p>
                )}
              </div>
              <span className="text-gray-500">
                {exercise.sets} x {exercise.reps}
              </span>
            </div>
          ))
        )}
      </div>
    );
  }

  // Edit mode
  return (
    <div className="space-y-3">
      {exercises.length === 0 ? (
        <p className="text-gray-500 text-center py-4">No exercises yet</p>
      ) : (
        exercises.map((exercise, index) => (
          <div key={exercise.id} className="bg-gray-50 rounded-xl p-3">
            {/* Confirm delete dialog */}
            {confirmDeleteId === exercise.id ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-800 text-sm font-medium mb-2">
                  Remove "{exercise.name}"?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleRemoveExercise(exercise.id)}
                    className="flex-1 py-1.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
                  >
                    Remove
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(null)}
                    className="flex-1 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : editingId === exercise.id ? (
              // Expanded edit form
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleMoveExercise(exercise.id, 'up')}
                      disabled={index === 0}
                      className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Move up"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleMoveExercise(exercise.id, 'down')}
                      disabled={index === exercises.length - 1}
                      className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Move down"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                  <button
                    onClick={() => setConfirmDeleteId(exercise.id)}
                    className="p-1.5 rounded-lg hover:bg-red-100 text-red-600"
                    title="Remove exercise"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
                  <input
                    type="text"
                    value={exercise.name}
                    onChange={(e) => handleUpdateExercise(exercise.id, { name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:outline-none"
                    placeholder="Exercise name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Sets</label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={exercise.sets}
                      onChange={(e) => handleUpdateExercise(exercise.id, { sets: parseInt(e.target.value) || 1 })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Reps</label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={exercise.reps}
                      onChange={(e) => handleUpdateExercise(exercise.id, { reps: parseInt(e.target.value) || 1 })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Notes (optional)</label>
                  <input
                    type="text"
                    value={exercise.notes || ''}
                    onChange={(e) => handleUpdateExercise(exercise.id, { notes: e.target.value || undefined })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:outline-none"
                    placeholder="Any notes..."
                  />
                </div>

                <button
                  onClick={() => setEditingId(null)}
                  className="w-full py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
                >
                  Done
                </button>
              </div>
            ) : (
              // Collapsed row
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5">
                    <button
                      onClick={() => handleMoveExercise(exercise.id, 'up')}
                      disabled={index === 0}
                      className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Move up"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleMoveExercise(exercise.id, 'down')}
                      disabled={index === exercises.length - 1}
                      className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Move down"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                  <div>
                    <span className="font-medium text-gray-900 text-sm">{exercise.name}</span>
                    <span className="text-gray-500 text-sm ml-2">
                      {exercise.sets} x {exercise.reps}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => setEditingId(exercise.id)}
                    className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-600"
                    title="Edit exercise"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(exercise.id)}
                    className="p-1.5 rounded-lg hover:bg-red-100 text-red-600"
                    title="Remove exercise"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        ))
      )}

      {/* Add exercise form */}
      {showAddForm ? (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-blue-800 font-medium text-sm mb-3">Add New Exercise</p>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
              <input
                type="text"
                value={newExercise.name}
                onChange={(e) => setNewExercise({ ...newExercise, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:outline-none"
                placeholder="Exercise name"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Sets *</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={newExercise.sets}
                  onChange={(e) => setNewExercise({ ...newExercise, sets: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Reps *</label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={newExercise.reps}
                  onChange={(e) => setNewExercise({ ...newExercise, reps: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
              <input
                type="text"
                value={newExercise.notes}
                onChange={(e) => setNewExercise({ ...newExercise, notes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:outline-none"
                placeholder="Optional notes..."
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleAddExercise}
                disabled={!newExercise.name.trim()}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Exercise
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setNewExercise({ name: '', sets: 3, reps: 10, notes: '' });
                }}
                className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-medium hover:border-blue-400 hover:text-blue-600 transition-colors"
        >
          + Add Exercise
        </button>
      )}
    </div>
  );
}
