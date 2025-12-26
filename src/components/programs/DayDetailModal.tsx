'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogPanel, DialogTitle, DialogBackdrop } from '@headlessui/react';
import type { DaySchedule, PlanExercise } from '@/types/plan';
import { ExerciseEditor } from './ExerciseEditor';

interface DayDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  day: DaySchedule | null;
  onSave: (dayOfWeek: string, updates: Partial<DaySchedule>) => Promise<void>;
}

const WORKOUT_TYPES: { value: DaySchedule['workoutType']; label: string }[] = [
  { value: 'upper_body', label: 'Upper Body' },
  { value: 'lower_body', label: 'Lower Body' },
  { value: 'full_body', label: 'Full Body' },
  { value: 'cardio', label: 'Cardio' },
  { value: 'rest', label: 'Rest Day' },
];

export function DayDetailModal({ isOpen, onClose, day, onSave }: DayDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  // Edit form state
  const [workoutName, setWorkoutName] = useState('');
  const [workoutType, setWorkoutType] = useState<DaySchedule['workoutType']>('rest');
  const [exercises, setExercises] = useState<PlanExercise[]>([]);

  // Reset form when day changes
  useEffect(() => {
    if (day) {
      setWorkoutName(day.workoutName);
      setWorkoutType(day.workoutType);
      setExercises([...day.exercises]);
      setIsEditing(false);
    }
  }, [day]);

  const hasChanges = () => {
    if (!day) return false;
    return (
      workoutName !== day.workoutName ||
      workoutType !== day.workoutType ||
      JSON.stringify(exercises) !== JSON.stringify(day.exercises)
    );
  };

  const handleClose = () => {
    if (isEditing && hasChanges()) {
      setShowDiscardConfirm(true);
    } else {
      onClose();
    }
  };

  const handleDiscard = () => {
    if (day) {
      setWorkoutName(day.workoutName);
      setWorkoutType(day.workoutType);
      setExercises([...day.exercises]);
    }
    setIsEditing(false);
    setShowDiscardConfirm(false);
    onClose();
  };

  const handleSave = async () => {
    if (!day) return;

    setSaving(true);
    try {
      await onSave(day.dayOfWeek, {
        workoutName,
        workoutType,
        exercises,
      });
      setIsEditing(false);
      onClose();
    } catch (error) {
      console.error('Error saving day:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges()) {
      setShowDiscardConfirm(true);
    } else {
      if (day) {
        setWorkoutName(day.workoutName);
        setWorkoutType(day.workoutType);
        setExercises([...day.exercises]);
      }
      setIsEditing(false);
    }
  };

  if (!day) return null;

  const isRest = workoutType === 'rest';

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-black/50 transition-opacity duration-200 data-[closed]:opacity-0"
      />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel
          transition
          className="w-full max-w-lg bg-white rounded-2xl shadow-xl transform transition-all duration-200 data-[closed]:scale-95 data-[closed]:opacity-0 max-h-[85vh] flex flex-col"
        >
          {/* Discard changes confirmation */}
          {showDiscardConfirm && (
            <div className="absolute inset-0 bg-white rounded-2xl z-10 flex items-center justify-center p-6">
              <div className="text-center">
                <p className="text-lg font-semibold text-gray-900 mb-2">Discard changes?</p>
                <p className="text-gray-600 mb-6">Your unsaved changes will be lost.</p>
                <div className="flex gap-3">
                  <button
                    onClick={handleDiscard}
                    className="flex-1 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700"
                  >
                    Discard
                  </button>
                  <button
                    onClick={() => setShowDiscardConfirm(false)}
                    className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200"
                  >
                    Keep Editing
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Header */}
          <div className="flex items-start justify-between p-6 pb-4 border-b border-gray-100">
            <div className="flex-1">
              <DialogTitle className="text-xl font-bold text-gray-900">
                {day.dayOfWeek}
              </DialogTitle>
              {isEditing && (
                <p className="text-sm text-blue-600 mt-1">Editing</p>
              )}
            </div>

            <div className="flex items-center gap-2">
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium hover:bg-blue-200 transition-colors"
                >
                  Edit
                </button>
              )}
              <button
                onClick={handleClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {isEditing ? (
              // Edit mode
              <div className="space-y-6">
                {/* Workout Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Workout Name
                  </label>
                  <input
                    type="text"
                    value={workoutName}
                    onChange={(e) => setWorkoutName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                    placeholder="e.g., Push Day"
                  />
                </div>

                {/* Workout Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Workout Type
                  </label>
                  <select
                    value={workoutType}
                    onChange={(e) => setWorkoutType(e.target.value as DaySchedule['workoutType'])}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none appearance-none bg-white"
                  >
                    {WORKOUT_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Exercises */}
                {!isRest && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Exercises
                    </label>
                    <ExerciseEditor
                      exercises={exercises}
                      isEditing={true}
                      onChange={setExercises}
                    />
                  </div>
                )}

                {isRest && (
                  <div className="text-center py-8 bg-gray-50 rounded-xl">
                    <span className="text-4xl mb-4 block">Rest Day</span>
                    <p className="text-gray-600">
                      No exercises for rest days
                    </p>
                  </div>
                )}
              </div>
            ) : (
              // View mode
              <div>
                {isRest ? (
                  <div className="text-center py-8">
                    <span className="text-4xl mb-4 block">Rest Day</span>
                    <p className="text-gray-600">
                      Recovery is just as important as training. Take it easy!
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Workout info */}
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {day.workoutName}
                      </h3>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                        workoutType === 'upper_body' ? 'bg-purple-100 text-purple-700' :
                        workoutType === 'lower_body' ? 'bg-green-100 text-green-700' :
                        workoutType === 'full_body' ? 'bg-blue-100 text-blue-700' :
                        workoutType === 'cardio' ? 'bg-orange-100 text-orange-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {WORKOUT_TYPES.find((t) => t.value === workoutType)?.label || workoutType}
                      </span>
                    </div>

                    {/* Exercises list */}
                    <div>
                      <p className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
                        Exercises ({day.exercises.length})
                      </p>
                      <ExerciseEditor
                        exercises={day.exercises}
                        isEditing={false}
                        onChange={() => {}}
                      />
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Footer - only in edit mode */}
          {isEditing && (
            <div className="p-6 pt-4 border-t border-gray-100">
              <div className="flex gap-3">
                <button
                  onClick={handleSave}
                  disabled={saving || !workoutName.trim()}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={saving}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </DialogPanel>
      </div>
    </Dialog>
  );
}
