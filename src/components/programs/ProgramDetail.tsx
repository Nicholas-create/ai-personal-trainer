'use client';

import { useState } from 'react';
import { format, differenceInDays } from 'date-fns';
import type { WorkoutPlan, DaySchedule } from '@/types/plan';
import { StatusBadge } from './StatusBadge';
import { EditableProgramName } from './EditableProgramName';
import { DayDetailModal } from './DayDetailModal';

interface ProgramDetailProps {
  plan: WorkoutPlan;
  onRename: (name: string) => Promise<void>;
  onPause: () => Promise<void>;
  onResume: () => Promise<void>;
  onArchive: () => Promise<void>;
  onExtend: (weeks: number) => Promise<void>;
  onDelete: () => Promise<void>;
  onDayUpdate?: (dayOfWeek: string, updates: Partial<DaySchedule>) => Promise<void>;
  onClose?: () => void;
}

type ConfirmAction = 'archive' | 'delete' | null;

export function ProgramDetail({
  plan,
  onRename,
  onPause,
  onResume,
  onArchive,
  onExtend,
  onDelete,
  onDayUpdate,
  onClose,
}: ProgramDetailProps) {
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [loading, setLoading] = useState(false);
  const [showExtendOptions, setShowExtendOptions] = useState(false);
  const [selectedDay, setSelectedDay] = useState<DaySchedule | null>(null);

  const startDate = plan.startedAt || plan.generatedAt;
  const duration = differenceInDays(plan.validUntil, startDate);
  const daysRemaining = differenceInDays(plan.validUntil, new Date());

  const handleAction = async (action: () => Promise<void>) => {
    setLoading(true);
    try {
      await action();
    } finally {
      setLoading(false);
      setConfirmAction(null);
    }
  };

  const handleExtend = async (weeks: number) => {
    setLoading(true);
    try {
      await onExtend(weeks);
      setShowExtendOptions(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1">
          <EditableProgramName name={plan.name} onSave={onRename} />
          <div className="flex items-center gap-2 mt-2">
            <StatusBadge status={plan.status} />
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 lg:hidden"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Info */}
      <div className="space-y-3 mb-6">
        <div className="flex justify-between py-2 border-b border-gray-100">
          <span className="text-gray-600">Started</span>
          <span className="font-semibold text-gray-900">{format(startDate, 'MMM d, yyyy')}</span>
        </div>
        <div className="flex justify-between py-2 border-b border-gray-100">
          <span className="text-gray-600">Ends</span>
          <span className="font-semibold text-gray-900">{format(plan.validUntil, 'MMM d, yyyy')}</span>
        </div>
        <div className="flex justify-between py-2 border-b border-gray-100">
          <span className="text-gray-600">Duration</span>
          <span className="font-semibold text-gray-900">{duration} days</span>
        </div>
        {plan.status === 'active' && (
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">Remaining</span>
            <span className={`font-semibold ${daysRemaining <= 7 ? 'text-amber-600' : 'text-gray-900'}`}>
              {daysRemaining > 0 ? `${daysRemaining} days` : 'Ending today'}
            </span>
          </div>
        )}
        {plan.originalValidUntil && (
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">Original end</span>
            <span className="font-semibold text-gray-500">{format(plan.originalValidUntil, 'MMM d, yyyy')}</span>
          </div>
        )}
      </div>

      {/* Weekly Schedule Summary */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Weekly Schedule</h4>
        <p className="text-xs text-gray-500 mb-2">Click a day to view or edit</p>
        <div className="grid grid-cols-7 gap-1">
          {plan.workoutSchedule.map((day) => (
            <button
              key={day.dayOfWeek}
              onClick={() => setSelectedDay(day)}
              className={`text-center p-2 rounded-lg text-xs cursor-pointer transition-all hover:scale-105 hover:shadow-md ${
                day.workoutType === 'rest'
                  ? 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
              }`}
            >
              <span className="block font-medium">{day.dayOfWeek.slice(0, 3)}</span>
              <span className="block mt-1 truncate">
                {day.workoutType === 'rest' ? 'Rest' : day.workoutName?.split(' ')[0] || day.workoutType.split('_')[0]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Confirmation dialogs */}
      {confirmAction === 'archive' && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
          <p className="text-amber-800 font-medium mb-3">Archive this program?</p>
          <p className="text-sm text-amber-700 mb-3">
            You can restore it later from the archived programs list.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => handleAction(onArchive)}
              disabled={loading}
              className="flex-1 py-2 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 disabled:opacity-50"
            >
              {loading ? 'Archiving...' : 'Archive'}
            </button>
            <button
              onClick={() => setConfirmAction(null)}
              disabled={loading}
              className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {confirmAction === 'delete' && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
          <p className="text-red-800 font-medium mb-3">Delete this program permanently?</p>
          <p className="text-sm text-red-700 mb-3">
            This action cannot be undone. Consider archiving instead.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => handleAction(onDelete)}
              disabled={loading}
              className="flex-1 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? 'Deleting...' : 'Delete'}
            </button>
            <button
              onClick={() => setConfirmAction(null)}
              disabled={loading}
              className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Extend options */}
      {showExtendOptions && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
          <p className="text-blue-800 font-medium mb-3">Extend program by:</p>
          <div className="flex gap-2">
            {[1, 2, 4].map((weeks) => (
              <button
                key={weeks}
                onClick={() => handleExtend(weeks)}
                disabled={loading}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? '...' : `${weeks} week${weeks > 1 ? 's' : ''}`}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowExtendOptions(false)}
            disabled={loading}
            className="w-full mt-2 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Actions */}
      {!confirmAction && !showExtendOptions && (
        <div className="space-y-2">
          {plan.status === 'active' && (
            <>
              <button
                onClick={() => handleAction(onPause)}
                disabled={loading}
                className="w-full py-3 bg-amber-100 text-amber-700 rounded-xl font-medium hover:bg-amber-200 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Pausing...' : '⏸ Pause Program'}
              </button>
              <button
                onClick={() => setShowExtendOptions(true)}
                disabled={loading}
                className="w-full py-3 bg-blue-100 text-blue-700 rounded-xl font-medium hover:bg-blue-200 disabled:opacity-50 transition-colors"
              >
                + Extend Program
              </button>
              <button
                onClick={() => setConfirmAction('archive')}
                disabled={loading}
                className="w-full py-3 bg-gray-100 text-gray-600 rounded-xl font-medium hover:bg-gray-200 disabled:opacity-50 transition-colors"
              >
                📦 Archive
              </button>
            </>
          )}

          {plan.status === 'paused' && (
            <>
              <button
                onClick={() => handleAction(onResume)}
                disabled={loading}
                className="w-full py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Resuming...' : '▶ Resume Program'}
              </button>
              <button
                onClick={() => setConfirmAction('archive')}
                disabled={loading}
                className="w-full py-3 bg-gray-100 text-gray-600 rounded-xl font-medium hover:bg-gray-200 disabled:opacity-50 transition-colors"
              >
                📦 Archive
              </button>
            </>
          )}

          {(plan.status === 'archived' || plan.status === 'expired') && (
            <>
              <button
                onClick={() => handleAction(onResume)}
                disabled={loading}
                className="w-full py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Restoring...' : '▶ Restore & Activate'}
              </button>
              <button
                onClick={() => setConfirmAction('delete')}
                disabled={loading}
                className="w-full py-3 bg-red-100 text-red-600 rounded-xl font-medium hover:bg-red-200 disabled:opacity-50 transition-colors"
              >
                🗑 Delete Permanently
              </button>
            </>
          )}
        </div>
      )}

      {/* Day Detail Modal */}
      {onDayUpdate && (
        <DayDetailModal
          isOpen={selectedDay !== null}
          onClose={() => setSelectedDay(null)}
          day={selectedDay}
          onSave={async (dayOfWeek, updates) => {
            await onDayUpdate(dayOfWeek, updates);
            setSelectedDay(null);
          }}
        />
      )}
    </div>
  );
}
