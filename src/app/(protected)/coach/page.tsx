'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
        }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message,
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
                <p className="text-base lg:text-lg whitespace-pre-wrap">
                  {message.content}
                </p>
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
    </div>
  );
}
