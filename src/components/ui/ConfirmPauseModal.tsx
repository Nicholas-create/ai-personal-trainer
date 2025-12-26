'use client';

import { Dialog, DialogPanel, DialogTitle, DialogBackdrop } from '@headlessui/react';

interface ConfirmPauseModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  currentProgramName: string;
  loading?: boolean;
}

export function ConfirmPauseModal({
  isOpen,
  onConfirm,
  onCancel,
  currentProgramName,
  loading = false,
}: ConfirmPauseModalProps) {
  return (
    <Dialog open={isOpen} onClose={onCancel} className="relative z-50">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-black/50 transition-opacity duration-200 data-[closed]:opacity-0"
      />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel
          transition
          className="w-full max-w-md bg-white rounded-2xl shadow-xl transform transition-all duration-200 data-[closed]:scale-95 data-[closed]:opacity-0"
        >
          <div className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-amber-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <DialogTitle className="text-xl font-bold text-gray-900">
                Create New Program?
              </DialogTitle>
            </div>

            <p className="text-gray-600 mb-2">
              Your current program <span className="font-semibold">"{currentProgramName}"</span> will
              be paused.
            </p>
            <p className="text-gray-500 text-sm mb-6">
              You can resume it anytime from the Programs page.
            </p>

            <div className="flex gap-3">
              <button
                onClick={onConfirm}
                disabled={loading}
                className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Creating...' : 'Pause & Create New'}
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
