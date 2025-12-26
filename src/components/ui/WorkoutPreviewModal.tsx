'use client';

import { Dialog, DialogPanel, DialogTitle, DialogBackdrop } from '@headlessui/react';
import type { DaySchedule } from '@/types/plan';

interface WorkoutPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedule: DaySchedule | null;
  dayName: string;
  dateDisplay: string;
  isCompleted: boolean;
  isToday: boolean;
}

export function WorkoutPreviewModal({
  isOpen,
  onClose,
  schedule,
  dayName,
  dateDisplay,
  isCompleted,
  isToday,
}: WorkoutPreviewModalProps) {
  const isRest = schedule?.workoutType === 'rest';

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-black/50 transition-opacity duration-200 data-[closed]:opacity-0"
      />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel
          transition
          className="w-full max-w-md bg-white rounded-2xl shadow-xl transform transition-all duration-200 data-[closed]:scale-95 data-[closed]:opacity-0"
        >
          <div className="flex items-start justify-between p-6 pb-4 border-b border-gray-100">
            <div>
              <p className="text-sm text-gray-500">{dateDisplay}</p>
              <DialogTitle className="text-xl font-bold text-gray-900">
                {isRest ? 'Rest Day' : schedule?.workoutName || dayName}
              </DialogTitle>
              <div className="flex gap-2 mt-2">
                {isToday && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                    Today
                  </span>
                )}
                {isCompleted && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                    Completed
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-6 max-h-[60vh] overflow-y-auto">
            {isRest ? (
              <div className="text-center py-8">
                <span className="text-4xl mb-4 block">😴</span>
                <p className="text-gray-600">
                  Recovery is just as important as training. Take it easy today!
                </p>
              </div>
            ) : schedule?.exercises && schedule.exercises.length > 0 ? (
              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                  Exercises ({schedule.exercises.length})
                </p>
                {schedule.exercises.map((exercise) => (
                  <div
                    key={exercise.id}
                    className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
                  >
                    <span className="font-medium text-gray-900">{exercise.name}</span>
                    <span className="text-gray-500">
                      {exercise.sets} x {exercise.reps}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No exercises scheduled
              </div>
            )}
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
