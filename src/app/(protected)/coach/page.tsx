'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  getActivePlan,
  createPlan,
  updateDayInPlan,
  updateExerciseInPlan,
  getExerciseLibrary,
  searchExercises,
  createExercise,
  getExerciseByName,
} from '@/lib/firebase/firestore';
import type { WorkoutPlan, DaySchedule, PlanExercise } from '@/types/plan';
import type { LibraryExercise, NewExercise, ExerciseFilters, MuscleGroup, EquipmentType, DifficultyLevel } from '@/types/exercise';
import { ConfirmPauseModal } from '@/components/ui/ConfirmPauseModal';
import { MarkdownMessage } from '@/components/chat/MarkdownMessage';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  planUpdated?: boolean;
}

interface ToolAction {
  tool: string;
  data: unknown;
}

const QUICK_ACTIONS = [
  { label: 'Modify today\'s workout', prompt: 'I need to modify today\'s workout. What are my options?' },
  { label: 'I\'m feeling tired', prompt: 'I\'m feeling tired today. Should I still work out or take it easy?' },
  { label: 'Show alternatives', prompt: 'Can you show me alternative exercises for my current workout?' },
  { label: 'Explain my progress', prompt: 'Can you explain my progress and how I\'m doing overall?' },
];

export default function CoachPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hi${user?.displayName ? ` ${user.displayName.split(' ')[0]}` : ''}! I'm your AI personal trainer. I know your goals${user?.profile?.goals?.length ? ` (${user.profile.goals.join(', ')})` : ''} and any limitations you've shared. How can I help you today?`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activePlan, setActivePlan] = useState<WorkoutPlan | null>(null);
  const [exerciseLibrary, setExerciseLibrary] = useState<LibraryExercise[]>([]);
  const [showPauseConfirmation, setShowPauseConfirmation] = useState(false);
  const [pendingPlanData, setPendingPlanData] = useState<DaySchedule[] | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load active plan and exercise library on mount
  useEffect(() => {
    async function loadData() {
      if (user?.uid) {
        try {
          const [plan, exercises] = await Promise.all([
            getActivePlan(user.uid),
            getExerciseLibrary(user.uid),
          ]);
          setActivePlan(plan);
          setExerciseLibrary(exercises);
        } catch (error) {
          console.error('Error loading data:', error);
        }
      }
    }
    loadData();
  }, [user?.uid]);

  // Build exercise library summary for API
  const exerciseLibrarySummary = exerciseLibrary.length > 0
    ? {
        totalExercises: exerciseLibrary.length,
        muscleGroups: [...new Set(exerciseLibrary.flatMap((e) => e.primaryMuscles))],
        equipmentTypes: [...new Set(exerciseLibrary.flatMap((e) => e.equipmentRequired))],
      }
    : null;

  const handleToolActions = async (toolActions: ToolAction[]): Promise<boolean> => {
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

            // No active plan, create directly
            await createPlan(user.uid, {
              generatedAt: new Date(),
              generatedBy: 'claude',
              active: true,
              workoutSchedule,
              validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              name: `Program - ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
              status: 'active',
            });
            // Reload the active plan
            const newPlan = await getActivePlan(user.uid);
            setActivePlan(newPlan);
            planUpdated = true;
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
            console.log(`Found ${results.length} exercises matching query`);
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
            // Reload exercise library
            const updatedLibrary = await getExerciseLibrary(user.uid);
            setExerciseLibrary(updatedLibrary);
            console.log(`Added exercise: ${exerciseData.name}`);
            break;
          }

          case 'get_exercise_details': {
            const { exerciseName } = action.data as { exerciseName: string };
            const exercise = await getExerciseByName(user.uid, exerciseName);
            if (exercise) {
              console.log(`Found exercise: ${exercise.name}`);
            } else {
              console.log(`Exercise not found: ${exerciseName}`);
            }
            break;
          }
        }
      } catch (error) {
        console.error(`Error executing tool ${action.tool}:`, error);
      }
    }

    return planUpdated;
  };

  const sendMessage = async (content: string) => {
    if (!content.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          userContext: user?.profile,
          activePlanSchedule: activePlan?.workoutSchedule || null,
          exerciseLibrarySummary,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error:', response.status, errorData);
        throw new Error(errorData.details || 'Failed to get response');
      }

      const data = await response.json();

      // Handle tool actions (save to Firestore)
      const planUpdated = await handleToolActions(data.toolActions || []);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message,
        planUpdated,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content:
            'Sorry, I encountered an error. Please try again in a moment.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleQuickAction = (prompt: string) => {
    sendMessage(prompt);
  };

  const handleConfirmCreatePlan = async () => {
    if (!user?.uid || !pendingPlanData) return;

    setLoading(true);
    try {
      await createPlan(user.uid, {
        generatedAt: new Date(),
        generatedBy: 'claude',
        active: true,
        workoutSchedule: pendingPlanData,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        name: `Program - ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
        status: 'active',
      });

      const newPlan = await getActivePlan(user.uid);
      setActivePlan(newPlan);

      // Update the last assistant message to show plan was saved
      setMessages((prev) => {
        const updated = [...prev];
        if (updated.length > 0 && updated[updated.length - 1].role === 'assistant') {
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            planUpdated: true,
          };
        }
        return updated;
      });
    } catch (error) {
      console.error('Error creating plan:', error);
    } finally {
      setLoading(false);
      setShowPauseConfirmation(false);
      setPendingPlanData(null);
    }
  };

  const handleCancelCreatePlan = () => {
    setShowPauseConfirmation(false);
    setPendingPlanData(null);

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        role: 'assistant',
        content:
          'No problem! I kept your current program active. Let me know if you change your mind or want to make modifications to your existing program instead.',
      },
    ]);
  };

  return (
    <div className="h-screen flex flex-col lg:flex-row">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4 lg:p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
              AI
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Your AI Coach</h1>
              <p className="text-green-600 text-sm">● Online — Knows your goals & history</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[85%] lg:max-w-[70%] p-4 rounded-2xl ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-sm'
                    : 'bg-white text-gray-900 shadow-sm rounded-bl-sm'
                }`}
              >
                {message.role === 'assistant' ? (
                  <MarkdownMessage content={message.content} />
                ) : (
                  <p className="text-base lg:text-lg whitespace-pre-wrap">
                    {message.content}
                  </p>
                )}
                {message.planUpdated && (
                  <div className="mt-2 pt-2 border-t border-green-200 text-sm text-green-600 flex items-center gap-1">
                    <span>&#10003;</span> Plan saved to your account
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-white text-gray-900 p-4 rounded-2xl shadow-sm rounded-bl-sm">
                <div className="flex items-center gap-2">
                  <div className="spinner" />
                  <span className="text-gray-500">Thinking...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="bg-white border-t border-gray-200 p-4 lg:p-6">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message here..."
              className="flex-1 p-4 text-lg border-2 border-gray-200 rounded-xl focus:border-blue-600 focus:outline-none"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="w-14 h-14 bg-blue-600 text-white rounded-xl flex items-center justify-center text-2xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ↑
            </button>
          </form>
        </div>
      </div>

      {/* Sidebar - Quick Actions (Desktop) */}
      <div className="hidden lg:block w-80 bg-white border-l border-gray-200 p-6 overflow-y-auto">
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-500 mb-4">
            QUICK ACTIONS
          </h3>
          <div className="space-y-3">
            {QUICK_ACTIONS.map((action, index) => (
              <button
                key={index}
                onClick={() => handleQuickAction(action.prompt)}
                disabled={loading}
                className="w-full p-4 text-left bg-gray-50 hover:bg-gray-100 rounded-xl text-gray-700 font-medium transition-colors disabled:opacity-50"
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
          <h3 className="text-sm font-semibold text-blue-800 mb-3">
            AI KNOWS ABOUT YOU
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Goals</span>
              <span className="font-medium text-gray-900">
                {user?.profile?.goals?.slice(0, 2).join(', ') || 'Not set'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Limitations</span>
              <span className="font-medium text-gray-900">
                {user?.profile?.limitations?.length
                  ? user.profile.limitations.slice(0, 2).join(', ')
                  : 'None'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Equipment</span>
              <span className="font-medium text-gray-900">
                {user?.profile?.equipment?.replace('_', ' ') || 'Not set'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Quick Actions */}
      <div className="lg:hidden bg-white border-t border-gray-200 p-4">
        <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
          {QUICK_ACTIONS.map((action, index) => (
            <button
              key={index}
              onClick={() => handleQuickAction(action.prompt)}
              disabled={loading}
              className="flex-shrink-0 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-sm font-medium text-gray-700 transition-colors disabled:opacity-50"
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>

      <ConfirmPauseModal
        isOpen={showPauseConfirmation}
        onConfirm={handleConfirmCreatePlan}
        onCancel={handleCancelCreatePlan}
        currentProgramName={activePlan?.name || 'current program'}
        loading={loading}
      />
    </div>
  );
}
