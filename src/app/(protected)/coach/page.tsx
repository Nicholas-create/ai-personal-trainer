'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  getActivePlan,
  updateDayInPlan,
  updateExerciseInPlan,
  getExerciseLibrary,
  createExercise,
  getExerciseByName,
  searchExercises,
} from '@/lib/firebase/firestore';
import { fetchWithAuth } from '@/lib/api/fetchWithAuth';
import { usePlanManagement } from '@/hooks/usePlanManagement';
import { useChatSession } from '@/hooks/useChatSession';
import type { DaySchedule, PlanExercise } from '@/types/plan';
import type { LibraryExercise, NewExercise, ExerciseFilters, MuscleGroup, EquipmentType, DifficultyLevel } from '@/types/exercise';
import { ConfirmPauseModal } from '@/components/ui/ConfirmPauseModal';
import { ChatHistoryDrawer } from '@/components/chat/ChatHistoryDrawer';
import { ChatInput } from '@/components/chat/ChatInput';
import { MessageList, type Message } from '@/components/chat/MessageList';
import { CoachHeader } from '@/components/chat/CoachHeader';
import { CoachSidebar, MobileQuickActions } from '@/components/chat/CoachSidebar';
import { logger } from '@/lib/logger';

interface ToolAction {
  tool: string;
  data: unknown;
}

const QUICK_ACTIONS = [
  { label: 'Modify today\'s workout', prompt: 'I need to modify today\'s workout. What are my options?' },
  { label: 'Show alternatives', prompt: 'Can you show me alternative exercises for my current workout?' },
  { label: 'Explain my progress', prompt: 'Can you explain my progress and how I\'m doing overall?' },
];

export default function CoachPage() {
  const { user } = useAuth();

  // Plan management hook
  const {
    activePlan,
    setActivePlan,
    isCreatingPlan,
    createNewPlan,
    loadActivePlan,
  } = usePlanManagement({ userId: user?.uid });

  // Chat session hook for persistence
  const {
    currentSession,
    messages: persistedMessages,
    sessions,
    loading: sessionLoading,
    sessionsLoading,
    sendMessage: persistMessages,
    startNewChat,
    loadSession,
    deleteSession,
  } = useChatSession({ userId: user?.uid });

  // Welcome message for new sessions
  const welcomeMessage: Message = useMemo(() => ({
    id: 'welcome',
    role: 'assistant',
    content: `Hi${user?.displayName ? ` ${user.displayName.split(' ')[0]}` : ''}! I'm your AI personal trainer. I know your goals${user?.profile?.goals?.length ? ` (${user.profile.goals.join(', ')})` : ''} and any limitations you've shared. How can I help you today?`,
  }), [user?.displayName, user?.profile?.goals]);

  // Always prepend welcome message to display (it's not persisted)
  const messages: Message[] = useMemo(() => {
    const mappedMessages = persistedMessages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      planUpdated: m.planUpdated,
    }));
    return [welcomeMessage, ...mappedMessages];
  }, [persistedMessages, welcomeMessage]);

  const [loading, setLoading] = useState(false);
  const [exerciseLibrary, setExerciseLibrary] = useState<LibraryExercise[]>([]);
  const [exerciseLibraryHash, setExerciseLibraryHash] = useState<string | null>(null);
  const [showPauseConfirmation, setShowPauseConfirmation] = useState(false);
  const [pendingPlanData, setPendingPlanData] = useState<DaySchedule[] | null>(null);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  // Track if library was modified since last API call to force full resend
  const libraryModifiedRef = useRef(false);

  // Load active plan and exercise library on mount
  useEffect(() => {
    async function loadData() {
      if (user?.uid) {
        try {
          await loadActivePlan();
          const exercises = await getExerciseLibrary(user.uid);
          setExerciseLibrary(exercises);
        } catch (error) {
          logger.error('Error loading data:', error);
        }
      }
    }
    loadData();
  }, [user?.uid, loadActivePlan]);

  // Memoize exercise library summary for API
  const exerciseLibrarySummary = useMemo(() => {
    if (exerciseLibrary.length === 0) return null;
    return {
      totalExercises: exerciseLibrary.length,
      muscleGroups: [...new Set(exerciseLibrary.flatMap((e) => e.primaryMuscles))],
      equipmentTypes: [...new Set(exerciseLibrary.flatMap((e) => e.equipmentRequired))],
    };
  }, [exerciseLibrary]);

  // Memoize exercise library data for server-side query tools
  const exerciseLibraryForQuery = useMemo(() => {
    return exerciseLibrary.map((ex) => ({
      id: ex.id,
      name: ex.name,
      primaryMuscles: ex.primaryMuscles,
      secondaryMuscles: ex.secondaryMuscles,
      equipmentRequired: ex.equipmentRequired,
      difficulty: ex.difficulty,
      instructions: ex.instructions,
      tips: ex.tips,
    }));
  }, [exerciseLibrary]);

  const handleToolActions = useCallback(async (toolActions: ToolAction[]): Promise<boolean> => {
    if (!user?.uid || toolActions.length === 0) return false;

    let planUpdated = false;

    for (const action of toolActions) {
      try {
        switch (action.tool) {
          case 'save_workout_plan': {
            const { workoutSchedule } = action.data as { workoutSchedule: DaySchedule[] };

            // If there's an active plan, show confirmation before creating new one
            if (activePlan) {
              setPendingPlanData(workoutSchedule);
              setShowPauseConfirmation(true);
              // Don't mark as updated yet - will be handled by confirmation
              return false;
            }

            // No active plan, create directly using the hook
            const success = await createNewPlan(workoutSchedule);
            planUpdated = success;
            break;
          }

          case 'update_day_schedule': {
            if (!activePlan) break;
            const { dayOfWeek, workoutType, workoutName, exercises } = action.data as {
              dayOfWeek: string;
              workoutType: string;
              workoutName: string;
              exercises: PlanExercise[];
            };
            await updateDayInPlan(user.uid, activePlan.id, dayOfWeek, {
              workoutType,
              workoutName,
              exercises,
            });
            // Reload the active plan
            const updatedPlan = await getActivePlan(user.uid);
            setActivePlan(updatedPlan);
            planUpdated = true;
            break;
          }

          case 'update_exercise': {
            if (!activePlan) break;
            const { dayOfWeek, exerciseId, updates } = action.data as {
              dayOfWeek: string;
              exerciseId: string;
              updates: Partial<PlanExercise>;
            };
            await updateExerciseInPlan(user.uid, activePlan.id, dayOfWeek, exerciseId, updates);
            // Reload the active plan
            const refreshedPlan = await getActivePlan(user.uid);
            setActivePlan(refreshedPlan);
            planUpdated = true;
            break;
          }

          // Exercise Library Tools - these return data to the AI
          case 'query_exercise_library': {
            const filters = action.data as ExerciseFilters;
            const results = await searchExercises(user.uid, filters);
            // Store results for tool response (handled in API continuation)
            logger.log(`Found ${results.length} exercises matching query`);
            break;
          }

          case 'add_exercise_to_library': {
            const exerciseData = action.data as {
              name: string;
              primaryMuscles: MuscleGroup[];
              secondaryMuscles?: MuscleGroup[];
              equipmentRequired: EquipmentType[];
              difficulty: DifficultyLevel;
              instructions: string[];
              tips?: string[];
            };
            const { secondaryMuscles, tips, ...requiredFields } = exerciseData;
            const newExercise: NewExercise = {
              ...requiredFields,
              isCustom: true,
              isDefault: false,
              ...(secondaryMuscles && secondaryMuscles.length > 0 && { secondaryMuscles }),
              ...(tips && tips.length > 0 && { tips }),
            };
            await createExercise(user.uid, newExercise);
            // Reload exercise library and mark as modified for next API call
            const updatedLibrary = await getExerciseLibrary(user.uid);
            setExerciseLibrary(updatedLibrary);
            libraryModifiedRef.current = true;
            logger.log(`Added exercise: ${exerciseData.name}`);
            break;
          }

          case 'get_exercise_details': {
            const { exerciseName } = action.data as { exerciseName: string };
            const exercise = await getExerciseByName(user.uid, exerciseName);
            if (exercise) {
              logger.log(`Found exercise: ${exercise.name}`);
            } else {
              logger.log(`Exercise not found: ${exerciseName}`);
            }
            break;
          }
        }
      } catch (error) {
        logger.error(`Error executing tool ${action.tool}:`, error);
      }
    }

    return planUpdated;
  }, [user?.uid, activePlan, createNewPlan, setActivePlan]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || loading) return;

    const userContent = content.trim();
    setLoading(true);

    try {
      // Build messages array for API (include persisted messages)
      const apiMessages = [
        ...persistedMessages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        { role: 'user' as const, content: userContent },
      ];

      // Conditionally send exercise library:
      // - Send full library if no hash yet, or if library was modified
      // - Otherwise send only the hash to use server cache
      const shouldSendFullLibrary = !exerciseLibraryHash || libraryModifiedRef.current;

      const response = await fetchWithAuth('/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          messages: apiMessages,
          userContext: user?.profile,
          activePlanSchedule: activePlan?.workoutSchedule || null,
          exerciseLibrarySummary,
          // Only send full library when needed, otherwise server uses cache
          exerciseLibrary: shouldSendFullLibrary ? exerciseLibraryForQuery : [],
          exerciseLibraryHash: exerciseLibraryHash || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        logger.error('API Error:', response.status, errorData);
        throw new Error(errorData.details || errorData.error || 'Failed to get response');
      }

      const data = await response.json();

      // Store the new hash from server and clear modified flag
      if (data.exerciseLibraryHash) {
        setExerciseLibraryHash(data.exerciseLibraryHash);
        libraryModifiedRef.current = false;
      }

      // Handle tool actions (save to Firestore)
      const planUpdated = await handleToolActions(data.toolActions || []);

      // Persist both messages to Firestore
      await persistMessages(userContent, data.message, planUpdated);
    } catch (error) {
      logger.error('Chat error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorResponse = errorMessage.includes('authenticated')
        ? 'Your session has expired. Please refresh the page and try again.'
        : 'Sorry, I encountered an error. Please try again in a moment.';

      // Still persist the user message and error response
      await persistMessages(userContent, errorResponse, false);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = (prompt: string) => {
    sendMessage(prompt);
  };

  const handleConfirmCreatePlan = async () => {
    if (!user?.uid || !pendingPlanData) return;

    setLoading(true);
    try {
      const success = await createNewPlan(pendingPlanData);

      if (success) {
        // Add a confirmation message that the plan was saved
        await persistMessages(
          'Create this plan',
          'Your new workout plan has been saved and is now active. Your previous program has been paused.',
          true
        );
      }
    } catch (error) {
      logger.error('Error creating plan:', error);
    } finally {
      setLoading(false);
      setShowPauseConfirmation(false);
      setPendingPlanData(null);
    }
  };

  const handleCancelCreatePlan = async () => {
    setShowPauseConfirmation(false);
    setPendingPlanData(null);

    // Persist the cancel response
    await persistMessages(
      'Keep current program',
      'No problem! I kept your current program active. Let me know if you change your mind or want to make modifications to your existing program instead.',
      false
    );
  };

  return (
    <div className="h-[calc(100vh-6rem)] lg:h-screen flex flex-col lg:flex-row">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-h-0 bg-gray-50">
        <CoachHeader
          displayName={user?.displayName}
          loading={loading || sessionLoading}
          onNewChat={startNewChat}
          onOpenHistory={() => setShowHistoryDrawer(true)}
        />

        <MessageList
          messages={messages}
          loading={loading}
          sessionLoading={sessionLoading}
        />

        <ChatInput
          onSend={sendMessage}
          disabled={loading}
        />
      </div>

      <CoachSidebar
        userProfile={user?.profile}
        sessions={sessions}
        activeSessionId={currentSession?.id || null}
        quickActions={QUICK_ACTIONS}
        loading={loading || sessionLoading}
        sessionsLoading={sessionsLoading}
        onNewChat={startNewChat}
        onQuickAction={handleQuickAction}
        onSelectSession={loadSession}
        onDeleteSession={deleteSession}
      />

      <MobileQuickActions
        quickActions={QUICK_ACTIONS}
        loading={loading}
        onQuickAction={handleQuickAction}
      />

      <ConfirmPauseModal
        isOpen={showPauseConfirmation}
        onConfirm={handleConfirmCreatePlan}
        onCancel={handleCancelCreatePlan}
        currentProgramName={activePlan?.name || 'current program'}
        loading={loading || isCreatingPlan}
      />

      <ChatHistoryDrawer
        isOpen={showHistoryDrawer}
        onClose={() => setShowHistoryDrawer(false)}
        sessions={sessions}
        activeSessionId={currentSession?.id || null}
        onSelectSession={loadSession}
        onDeleteSession={deleteSession}
        onNewChat={startNewChat}
        loading={sessionsLoading}
      />
    </div>
  );
}
