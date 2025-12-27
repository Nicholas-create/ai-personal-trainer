'use client';

interface CoachHeaderProps {
  displayName?: string;
  loading?: boolean;
  onNewChat: () => void;
  onOpenHistory: () => void;
}

export function CoachHeader({
  displayName,
  loading = false,
  onNewChat,
  onOpenHistory,
}: CoachHeaderProps) {
  return (
    <div className="bg-white border-b border-gray-200 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
            AI
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Your AI Coach</h1>
            <p className="text-green-600 text-sm">● Online — Knows your goals & history</p>
          </div>
        </div>
        {/* Mobile header buttons */}
        <div className="flex items-center gap-2 lg:hidden">
          <button
            onClick={onNewChat}
            disabled={loading}
            className="p-3 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors disabled:opacity-50"
            aria-label="New chat"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </button>
          <button
            onClick={onOpenHistory}
            className="p-3 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
            aria-label="Chat history"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
