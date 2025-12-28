'use client';

import { Dialog, DialogPanel, DialogTitle, DialogBackdrop } from '@headlessui/react';
import type { DaySchedule, PlanExercise } from '@/types/plan';

interface ToolAction {
  tool: string;
  data: unknown;
}

interface ConfirmWorkoutChangeModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  toolActions: ToolAction[];
  loading?: boolean;
}

export function ConfirmWorkoutChangeModal({
  isOpen,
  onConfirm,
  onCancel,
  toolActions,
  loading = false,
}: ConfirmWorkoutChangeModalProps) {
  const renderActionPreview = (action: ToolAction) => {
    switch (action.tool) {
      case 'save_workout_plan': {
        const { workoutSchedule } = action.data as { workoutSchedule: DaySchedule[] };
        return (
          <div>
            <h4 className="font-medium text-gray-900">New Workout Plan</h4>
            <div className="mt-2 space-y-1">
              {workoutSchedule.map((day) => (
                <div key={day.dayOfWeek} className="text-sm text-gray-600">
                  <span className="font-medium text-gray-700">{day.dayOfWeek}:</span>{' '}
                  {day.workoutType === 'rest' ? (
                    <span className="text-gray-500 italic">Rest Day</span>
                  ) : (
                    <>
                      {day.workoutName}
                      {day.exercises.length > 0 && (
                        <span className="text-gray-400"> ({day.exercises.length} exercises)</span>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      }
      case 'update_day_schedule': {
        const { dayOfWeek, workoutName, exercises } = action.data as {
          dayOfWeek: string;
          workoutName: string;
          exercises: PlanExercise[];
        };
        return (
          <div>
            <h4 className="font-medium text-gray-900">Update {dayOfWeek}</h4>
            <p className="text-sm text-gray-600 mt-1">{workoutName}</p>
            {exercises.length > 0 && (
              <ul className="mt-2 space-y-1">
                {exercises.map((ex) => (
                  <li key={ex.id} className="text-sm text-gray-600">
                    • {ex.name} - {ex.sets}×{ex.reps}
                    {ex.notes && <span className="text-gray-400 text-xs ml-1">({ex.notes})</span>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      }
      case 'update_exercise': {
        const { dayOfWeek, updates } = action.data as {
          dayOfWeek: string;
          exerciseId: string;
          updates: Partial<PlanExercise>;
        };
        const changes: string[] = [];
        if (updates.sets !== undefined) changes.push(`Sets: ${updates.sets}`);
        if (updates.reps !== undefined) changes.push(`Reps: ${updates.reps}`);
        if (updates.notes !== undefined) changes.push(`Notes: ${updates.notes}`);

        return (
          <div>
            <h4 className="font-medium text-gray-900">Update Exercise on {dayOfWeek}</h4>
            <p className="text-sm text-gray-600 mt-1">
              {changes.length > 0 ? changes.join(', ') : 'No changes specified'}
            </p>
          </div>
        );
      }
      case 'add_exercise_to_library': {
        const { name, primaryMuscles } = action.data as {
          name: string;
          primaryMuscles: string[];
        };
        return (
          <div>
            <h4 className="font-medium text-gray-900">Add to Exercise Library</h4>
            <p className="text-sm text-gray-600 mt-1">
              {name} ({primaryMuscles.join(', ')})
            </p>
          </div>
        );
      }
      default:
        return null;
    }
  };

  const writeActions = toolActions.filter((a) =>
    ['save_workout_plan', 'update_day_schedule', 'update_exercise', 'add_exercise_to_library'].includes(a.tool)
  );

  if (writeActions.length === 0) return null;

  return (
    <Dialog open={isOpen} onClose={onCancel} className="relative z-50">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-black/50 transition-opacity duration-200 data-[closed]:opacity-0"
      />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel
          transition
          className="w-full max-w-md bg-white rounded-2xl shadow-xl transform transition-all duration-200 data-[closed]:scale-95 data-[closed]:opacity-0 max-h-[80vh] overflow-hidden flex flex-col"
        >
          <div className="p-6 flex-shrink-0">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <DialogTitle className="text-xl font-bold text-gray-900">
                Confirm Changes
              </DialogTitle>
            </div>

            <p className="text-gray-600 text-sm mb-4">
              Review the changes below before saving:
            </p>
          </div>

          <div className="px-6 overflow-y-auto flex-1">
            <div className="space-y-3 pb-4">
              {writeActions.map((action, i) => (
                <div key={i} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                  {renderActionPreview(action)}
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 flex-shrink-0 border-t border-gray-100">
            <div className="flex gap-3">
              <button
                onClick={onConfirm}
                disabled={loading}
                className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={onCancel}
                disabled={loading}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
