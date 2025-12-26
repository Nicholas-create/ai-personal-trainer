'use client';

import { Dialog, DialogPanel, DialogTitle, DialogBackdrop } from '@headlessui/react';

export interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

const variantStyles = {
  danger: {
    button: 'bg-red-600 hover:bg-red-700 text-white',
    icon: '⚠️',
  },
  warning: {
    button: 'bg-amber-600 hover:bg-amber-700 text-white',
    icon: '⚠️',
  },
  info: {
    button: 'bg-blue-600 hover:bg-blue-700 text-white',
    icon: 'ℹ️',
  },
};

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  isLoading = false,
}: ConfirmationDialogProps) {
  const styles = variantStyles[variant];

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-black/50 transition-opacity duration-200 data-[closed]:opacity-0"
      />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel
          transition
          className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6 transform transition-all duration-200 data-[closed]:scale-95 data-[closed]:opacity-0"
        >
          <div className="text-center">
            <DialogTitle className="text-lg font-semibold text-gray-900 mb-2">
              {title}
            </DialogTitle>
            <p className="text-gray-600 mb-6">{message}</p>
            <div className="flex gap-3">
              <button
                onClick={onConfirm}
                disabled={isLoading}
                className={`flex-1 py-3 rounded-xl font-medium transition-colors disabled:opacity-50 ${styles.button}`}
              >
                {isLoading ? 'Please wait...' : confirmLabel}
              </button>
              <button
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 disabled:opacity-50 transition-colors"
              >
                {cancelLabel}
              </button>
            </div>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}

// Specialized variants for common use cases
export function DiscardChangesDialog({
  isOpen,
  onClose,
  onDiscard,
}: {
  isOpen: boolean;
  onClose: () => void;
  onDiscard: () => void;
}) {
  return (
    <ConfirmationDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onDiscard}
      title="Discard changes?"
      message="Your unsaved changes will be lost."
      confirmLabel="Discard"
      cancelLabel="Keep Editing"
      variant="warning"
    />
  );
}

export function DeleteConfirmationDialog({
  isOpen,
  onClose,
  onDelete,
  itemName = 'this item',
  isLoading = false,
}: {
  isOpen: boolean;
  onClose: () => void;
  onDelete: () => void;
  itemName?: string;
  isLoading?: boolean;
}) {
  return (
    <ConfirmationDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onDelete}
      title={`Delete ${itemName}?`}
      message="This action cannot be undone."
      confirmLabel="Delete"
      cancelLabel="Cancel"
      variant="danger"
      isLoading={isLoading}
    />
  );
}
