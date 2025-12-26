'use client';

import type { SaveStatus } from '@/hooks/useProfileField';

interface SaveIndicatorProps {
  status: SaveStatus;
  onRetry?: () => void;
}

export function SaveIndicator({ status, onRetry }: SaveIndicatorProps) {
  if (status === 'idle') return null;

  return (
    <span className="inline-flex items-center ml-2 text-xs">
      {status === 'saving' && (
        <span className="flex items-center text-gray-500">
          <svg
            className="animate-spin h-3 w-3 mr-1"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Saving...
        </span>
      )}

      {status === 'saved' && (
        <span className="flex items-center text-green-600 animate-fade-in">
          <svg
            className="h-3 w-3 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Saved
        </span>
      )}

      {status === 'error' && (
        <span className="flex items-center text-red-600">
          <svg
            className="h-3 w-3 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Failed
          {onRetry && (
            <button
              onClick={onRetry}
              className="ml-1 underline hover:no-underline"
            >
              Retry
            </button>
          )}
        </span>
      )}
    </span>
  );
}
