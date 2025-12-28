import { useState, useCallback, useEffect } from 'react';
import {
  getActiveChatSession,
  getChatSessions,
  createChatSession,
  getChatMessages,
  addChatMessage,
  setActiveChatSession,
  deactivateChatSession,
  deleteChatSession,
} from '@/lib/firebase/firestore';
import { withRetry } from '@/lib/firebase/firestoreRetry';
import { logger } from '@/lib/logger';
import type { ChatSession, ChatMessage, NewChatMessage } from '@/types/chat';

interface UseChatSessionProps {
  userId: string | undefined;
}

interface UseChatSessionReturn {
  // State
  currentSession: ChatSession | null;
  messages: ChatMessage[];
  sessions: ChatSession[];
  loading: boolean;
  sessionsLoading: boolean;
  error: string | null;

  // Actions
  sendMessage: (
    userContent: string,
    assistantContent: string,
    planUpdated?: boolean
  ) => Promise<void>;
  startNewChat: () => Promise<void>;
  loadSession: (sessionId: string) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  refreshSessions: () => Promise<void>;
}

/**
 * Hook for managing persistent chat sessions
 * Handles session creation, message persistence, and session switching
 */
export function useChatSession({
  userId,
}: UseChatSessionProps): UseChatSessionReturn {
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Initialize on mount - always start with a fresh chat
   * Users can load previous sessions from the sidebar
   */
  const loadActiveSession = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    // Always start fresh - no active session
    setCurrentSession(null);
    setMessages([]);
    setLoading(false);
  }, [userId]);

  /**
   * Load the list of sessions for the sidebar
   * Shows all sessions from Firestore (persists across browsers)
   */
  const refreshSessions = useCallback(async () => {
    if (!userId) return;

    try {
      setSessionsLoading(true);
      const allSessions = await withRetry(() => getChatSessions(userId, 50));
      setSessions(allSessions);
    } catch (err) {
      logger.error('Error loading sessions:', err);
    } finally {
      setSessionsLoading(false);
    }
  }, [userId]);

  // Load active session on mount
  useEffect(() => {
    loadActiveSession();
  }, [loadActiveSession]);

  // Load sessions list on mount
  useEffect(() => {
    refreshSessions();
  }, [refreshSessions]);

  /**
   * Send a message pair (user + assistant) and persist to Firestore
   * Creates a new session if none exists
   */
  const sendMessage = useCallback(
    async (
      userContent: string,
      assistantContent: string,
      planUpdated?: boolean
    ) => {
      if (!userId) {
        setError('User not authenticated');
        return;
      }

      try {
        setError(null);
        let sessionId = currentSession?.id;

        // Create session if this is the first message
        if (!sessionId) {
          // Generate title from first 50 chars of user message
          const title =
            userContent.length > 50
              ? userContent.substring(0, 50) + '...'
              : userContent;

          sessionId = await withRetry(() => createChatSession(userId, title));

          // Reload the new session
          const newSession = await withRetry(() => getActiveChatSession(userId));
          setCurrentSession(newSession);
        }

        // Create optimistic message objects for immediate UI update
        const now = new Date();
        const userMessage: ChatMessage = {
          id: `temp-user-${Date.now()}`,
          role: 'user',
          content: userContent,
          createdAt: now,
        };

        const assistantMessage: ChatMessage = {
          id: `temp-assistant-${Date.now()}`,
          role: 'assistant',
          content: assistantContent,
          createdAt: now,
          planUpdated,
        };

        // Update local state immediately (optimistic update)
        setMessages((prev) => [...prev, userMessage, assistantMessage]);

        // Persist to Firestore
        const userMsg: NewChatMessage = {
          role: 'user',
          content: userContent,
        };

        const assistantMsg: NewChatMessage = {
          role: 'assistant',
          content: assistantContent,
          planUpdated,
        };

        await withRetry(() => addChatMessage(userId, sessionId!, userMsg));
        await withRetry(() => addChatMessage(userId, sessionId!, assistantMsg));

        // Refresh sessions list to update lastMessage/updatedAt
        await refreshSessions();
      } catch (err) {
        logger.error('Error sending message:', err);
        setError('Failed to save message.');
      }
    },
    [userId, currentSession, refreshSessions]
  );

  /**
   * Start a new chat - deactivates current session and resets state
   */
  const startNewChat = useCallback(async () => {
    if (!userId) return;

    try {
      setError(null);

      // Deactivate current session if exists
      if (currentSession) {
        await withRetry(() => deactivateChatSession(userId, currentSession.id));
      }

      // Reset local state
      setCurrentSession(null);
      setMessages([]);

      // Refresh sessions list
      await refreshSessions();
    } catch (err) {
      logger.error('Error starting new chat:', err);
      setError('Failed to start new chat.');
    }
  }, [userId, currentSession, refreshSessions]);

  /**
   * Load a specific session by ID
   */
  const loadSession = useCallback(
    async (sessionId: string) => {
      if (!userId) return;

      try {
        setLoading(true);
        setError(null);

        // Set the session as active (deactivates others)
        await withRetry(() => setActiveChatSession(userId, sessionId));

        // Load the session's messages
        const sessionMessages = await withRetry(() =>
          getChatMessages(userId, sessionId)
        );

        // Find the session in our list
        const session = sessions.find((s) => s.id === sessionId);
        if (session) {
          setCurrentSession({ ...session, isActive: true });
        }

        setMessages(sessionMessages);

        // Refresh sessions to update active states
        await refreshSessions();
      } catch (err) {
        logger.error('Error loading session:', err);
        setError('Failed to load chat.');
      } finally {
        setLoading(false);
      }
    },
    [userId, sessions, refreshSessions]
  );

  /**
   * Delete a session and all its messages
   */
  const deleteSession = useCallback(
    async (sessionId: string) => {
      if (!userId) return;

      try {
        setError(null);

        await withRetry(() => deleteChatSession(userId, sessionId));

        // If we deleted the current session, reset to welcome state
        if (currentSession?.id === sessionId) {
          setCurrentSession(null);
          setMessages([]);
        }

        // Refresh sessions list
        await refreshSessions();
      } catch (err) {
        logger.error('Error deleting session:', err);
        setError('Failed to delete chat.');
      }
    },
    [userId, currentSession, refreshSessions]
  );

  return {
    currentSession,
    messages,
    sessions,
    loading,
    sessionsLoading,
    error,
    sendMessage,
    startNewChat,
    loadSession,
    deleteSession,
    refreshSessions,
  };
}
