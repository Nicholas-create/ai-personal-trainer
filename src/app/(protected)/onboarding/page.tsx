'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { updateUserProfile } from '@/lib/firebase/firestore';
import type { UserProfile } from '@/types/user';
import {
  OnboardingState,
  OnboardingChatResponse,
  getEmptyOnboardingState,
  isOnboardingComplete,
  GOAL_OPTIONS,
  LIMITATION_OPTIONS,
  EQUIPMENT_OPTIONS,
  EXPERIENCE_OPTIONS,
  DAY_OPTIONS,
  SESSION_LENGTH_OPTIONS,
  UNIT_OPTIONS,
} from '@/types/onboarding';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const FIELD_LABELS: Record<keyof OnboardingState, string> = {
  goals: 'Goals',
  limitations: 'Limitations',
  equipment: 'Equipment',
  experienceLevel: 'Experience',
  workoutDays: 'Workout Days',
  sessionLength: 'Session Length',
  units: 'Units',
};

function getValueLabel(field: keyof OnboardingState, value: string | string[] | number | null): string {
  if (value === null) return '';

  const labelMaps: Record<string, Record<string, string>> = {
    goals: Object.fromEntries(GOAL_OPTIONS.map(o => [o.id, o.label])),
    limitations: Object.fromEntries(LIMITATION_OPTIONS.map(o => [o.id, o.label])),
    equipment: Object.fromEntries(EQUIPMENT_OPTIONS.map(o => [o.id, o.label])),
    experienceLevel: Object.fromEntries(EXPERIENCE_OPTIONS.map(o => [o.id, o.label])),
    workoutDays: Object.fromEntries(DAY_OPTIONS.map(o => [o.id, o.label.slice(0, 3)])),
    sessionLength: Object.fromEntries(SESSION_LENGTH_OPTIONS.map(o => [String(o.id), o.label])),
    units: Object.fromEntries(UNIT_OPTIONS.map(o => [o.id, o.label])),
  };

  if (Array.isArray(value)) {
    return value.map(v => labelMaps[field]?.[v] || v).join(', ');
  }
  return labelMaps[field]?.[String(value)] || String(value);
}

export default function OnboardingPage() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hi${user?.displayName ? ` ${user.displayName.split(' ')[0]}` : ''}! I'm excited to help you set up your personalized fitness plan.\n\nLet's start with the most important question - what are your fitness goals? Are you looking to build strength, improve mobility, lose weight, or something else?`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [onboardingData, setOnboardingData] = useState<OnboardingState>(getEmptyOnboardingState());
  const [suggestedOptions, setSuggestedOptions] = useState<OnboardingChatResponse['suggestedOptions']>({
    field: 'goals',
    options: GOAL_OPTIONS.map(o => ({ id: o.id, label: o.label })),
    multiSelect: true,
  });
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [readyToComplete, setReadyToComplete] = useState(false);
  const [userConfirmed, setUserConfirmed] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (messageContent: string) => {
    if (!messageContent.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageContent,
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setSelectedOptions([]);
    setLoading(true);

    try {
      const response = await fetch('/api/onboarding-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          collectedData: onboardingData,
          userConfirmed,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data: OnboardingChatResponse = await response.json();

      // Update collected data
      if (data.extractedData.length > 0) {
        setOnboardingData(prev => {
          const updated = { ...prev };
          for (const { field, value } of data.extractedData) {
            (updated as Record<string, unknown>)[field] = value;
          }
          return updated;
        });
      }

      // Update suggested options
      if (data.suggestedOptions) {
        setSuggestedOptions(data.suggestedOptions);
      } else {
        setSuggestedOptions(undefined);
      }

      // Check if complete
      if (data.isComplete) {
        setReadyToComplete(true);
        setUserConfirmed(true);
      }

      // Add assistant message
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message,
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Sorry, I encountered an issue. Could you please try again?",
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleOptionClick = (optionId: string) => {
    if (!suggestedOptions) return;

    if (suggestedOptions.multiSelect) {
      setSelectedOptions(prev =>
        prev.includes(optionId)
          ? prev.filter(id => id !== optionId)
          : [...prev, optionId]
      );
    } else {
      // Single select - send immediately
      const option = suggestedOptions.options.find(o => o.id === optionId);
      if (option) {
        sendMessage(option.label);
      }
    }
  };

  const handleSendSelected = () => {
    if (selectedOptions.length === 0 || !suggestedOptions) return;
    const labels = selectedOptions
      .map(id => suggestedOptions.options.find(o => o.id === id)?.label)
      .filter(Boolean)
      .join(', ');
    sendMessage(labels);
  };

  const handleComplete = async () => {
    if (!user || !isOnboardingComplete(onboardingData)) return;

    try {
      setSaving(true);

      const profile: UserProfile = {
        goals: onboardingData.goals!,
        limitations: onboardingData.limitations!.filter(l => l !== 'none'),
        equipment: onboardingData.equipment as 'full_gym' | 'home' | 'minimal',
        experienceLevel: onboardingData.experienceLevel as 'beginner' | 'intermediate' | 'advanced',
        workoutDays: onboardingData.workoutDays!,
        sessionLength: onboardingData.sessionLength!,
        units: onboardingData.units as 'lbs' | 'kg',
      };

      await updateUserProfile(user.uid, profile);
      await refreshUser();
      router.push('/dashboard');
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const completedFieldsCount = Object.values(onboardingData).filter(v => v !== null && (Array.isArray(v) ? v.length > 0 : true)).length;
  const totalFields = 7;
  const progressPercent = Math.round((completedFieldsCount / totalFields) * 100);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Progress Sidebar - Desktop */}
      <div className="hidden lg:flex lg:flex-col lg:w-80 bg-white border-r border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Setting Up Your Profile</h2>
        <p className="text-sm text-gray-500 mb-6">{progressPercent}% complete</p>

        {/* Progress Bar */}
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-8">
          <div
            className="h-full bg-blue-600 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Field Checklist */}
        <div className="space-y-4">
          {(Object.keys(FIELD_LABELS) as (keyof OnboardingState)[]).map((field) => {
            const value = onboardingData[field];
            const isCompleted = value !== null && (Array.isArray(value) ? value.length > 0 : true);

            return (
              <div key={field} className="flex items-start gap-3">
                <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                  isCompleted ? 'bg-green-500' : 'bg-gray-200'
                }`}>
                  {isCompleted && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>
                    {FIELD_LABELS[field]}
                  </p>
                  {isCompleted && (
                    <p className="text-xs text-gray-500 truncate">
                      {getValueLabel(field, value)}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Complete Button */}
        {readyToComplete && (
          <div className="mt-auto pt-6">
            <button
              onClick={handleComplete}
              disabled={saving}
              className="w-full py-3 px-4 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Complete Setup'}
            </button>
          </div>
        )}
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full">
        {/* Mobile Progress Bar */}
        <div className="lg:hidden px-4 py-3 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Setting up your profile</span>
            <span className="text-sm text-gray-500">{progressPercent}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-800'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 text-gray-500">
                Thinking...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Option Buttons */}
        {suggestedOptions && !loading && (
          <div className="px-4 pb-2">
            <div className="flex flex-wrap gap-2 mb-2">
              {suggestedOptions.options.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleOptionClick(option.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedOptions.includes(option.id)
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-gray-300 text-gray-700 hover:border-blue-400 hover:text-blue-600'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            {suggestedOptions.multiSelect && selectedOptions.length > 0 && (
              <button
                onClick={handleSendSelected}
                className="w-full py-2 px-4 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
              >
                Send Selection ({selectedOptions.length})
              </button>
            )}
          </div>
        )}

        {/* Mobile Complete Button */}
        {readyToComplete && (
          <div className="lg:hidden px-4 pb-2">
            <button
              onClick={handleComplete}
              disabled={saving}
              className="w-full py-3 px-4 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Complete Setup'}
            </button>
          </div>
        )}

        {/* Input Area */}
        <form onSubmit={handleSubmit} className="p-4 bg-white border-t border-gray-200">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              disabled={loading || readyToComplete}
              className="flex-1 px-4 py-3 bg-gray-100 border-0 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading || readyToComplete}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
