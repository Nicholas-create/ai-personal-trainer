'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { DeleteConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import type { ChatSession } from '@/types/chat';

interface ChatSessionListProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  loading?: boolean;
}

export function ChatSessionList({
  sessions,
  activeSessionId,
  onSelectSession,
  onDeleteSession,
  loading = false,
}: ChatSessionListProps) {
  const [deleteSessionId, setDeleteSessionId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation(); // Prevent selecting the session
    setDeleteSessionId(sessionId);
  };

  const handleConfirmDelete = async () => {
    if (!deleteSessionId) return;

    setIsDeleting(true);
    await onDeleteSession(deleteSessionId);
    setIsDeleting(false);
    setDeleteSessionId(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p className="text-lg mb-1">No conversations yet</p>
        <p className="text-sm">Start chatting with your AI coach!</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {sessions.map((session) => {
          const isActive = session.id === activeSessionId;

          return (
            <div
              key={session.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelectSession(session.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectSession(session.id);
                }
              }}
              className={`w-full text-left px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                isActive
                  ? 'bg-blue-50 border border-blue-400'
                  : 'bg-gray-50 hover:bg-gray-100 border border-transparent'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0 flex items-center gap-2">
                  {/* Title */}
                  <p
                    className={`font-medium truncate text-sm ${
                      isActive ? 'text-blue-900' : 'text-gray-900'
                    }`}
                  >
                    {session.title}
                  </p>
                  {/* Timestamp */}
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {formatDistanceToNow(session.updatedAt, { addSuffix: true })}
                  </span>
                </div>

                {/* Delete button */}
                <button
                  onClick={(e) => handleDeleteClick(e, session.id)}
                  className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors flex-shrink-0"
                  aria-label="Delete conversation"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Delete confirmation dialog */}
      <DeleteConfirmationDialog
        isOpen={deleteSessionId !== null}
        onClose={() => setDeleteSessionId(null)}
        onDelete={handleConfirmDelete}
        itemName="this conversation"
        isLoading={isDeleting}
      />
    </>
  );
}
