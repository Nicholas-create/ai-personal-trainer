'use client';

import { ChatSessionList } from './ChatSessionList';
import type { ChatSession } from '@/types/chat';
import type { UserProfile } from '@/types/user';

interface QuickAction {
  label: string;
  prompt: string;
}

interface CoachSidebarProps {
  userProfile?: UserProfile;
  sessions: ChatSession[];
  activeSessionId: string | null;
  quickActions: QuickAction[];
  loading?: boolean;
  sessionsLoading?: boolean;
  onNewChat: () => void;
  onQuickAction: (prompt: string) => void;
  onSelectSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
}

export function CoachSidebar({
  userProfile,
  sessions,
  activeSessionId,
  quickActions,
  loading = false,
  sessionsLoading = false,
  onNewChat,
  onQuickAction,
  onSelectSession,
  onDeleteSession,
}: CoachSidebarProps) {
  return (
    <div className="hidden lg:block w-80 bg-white border-l border-gray-200 p-6 overflow-y-auto">
      {/* New Chat Button */}
      <button
        onClick={onNewChat}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-3 mb-6 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
            clipRule="evenodd"
          />
        </svg>
        New Chat
      </button>

      {/* AI Knows About You */}
      <div className="p-4 mb-6 bg-blue-50 rounded-xl border border-blue-200">
        <h3 className="text-sm font-semibold text-blue-800 mb-3">
          AI KNOWS ABOUT YOU
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Goals</span>
            <span className="font-medium text-gray-900">
              {userProfile?.goals?.slice(0, 2).join(', ') || 'Not set'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Limitations</span>
            <span className="font-medium text-gray-900">
              {userProfile?.limitations?.length
                ? userProfile.limitations.slice(0, 2).join(', ')
                : 'None'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Equipment</span>
            <span className="font-medium text-gray-900">
              {userProfile?.equipment?.replace('_', ' ') || 'Not set'}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-500 mb-4">
          QUICK ACTIONS
        </h3>
        <div className="space-y-3">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={() => onQuickAction(action.prompt)}
              disabled={loading}
              className="w-full p-4 text-left bg-gray-50 hover:bg-gray-100 rounded-xl text-gray-700 font-medium transition-colors disabled:opacity-50"
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chat History */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-500 mb-4">
          CHAT HISTORY
        </h3>
        <ChatSessionList
          sessions={sessions.slice(0, 5)}
          activeSessionId={activeSessionId}
          onSelectSession={onSelectSession}
          onDeleteSession={onDeleteSession}
          loading={sessionsLoading}
        />
      </div>
    </div>
  );
}

interface MobileQuickActionsProps {
  quickActions: QuickAction[];
  loading?: boolean;
  onQuickAction: (prompt: string) => void;
}

export function MobileQuickActions({
  quickActions,
  loading = false,
  onQuickAction,
}: MobileQuickActionsProps) {
  return (
    <div className="lg:hidden bg-white border-t border-gray-200 p-4">
      <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
        {quickActions.map((action, index) => (
          <button
            key={index}
            onClick={() => onQuickAction(action.prompt)}
            disabled={loading}
            className="flex-shrink-0 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-sm font-medium text-gray-700 transition-colors disabled:opacity-50"
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}
