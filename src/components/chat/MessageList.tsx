'use client';

import { useRef, useEffect } from 'react';
import { MarkdownMessage } from './MarkdownMessage';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  planUpdated?: boolean;
}

interface MessageListProps {
  messages: Message[];
  loading?: boolean;
  sessionLoading?: boolean;
}

export function MessageList({
  messages,
  loading = false,
  sessionLoading = false,
}: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (sessionLoading) {
    return (
      <div className="flex-1 min-h-0 overflow-y-auto p-4 lg:p-6">
        <div className="flex items-center justify-center h-32">
          <div className="flex items-center gap-3 text-gray-500">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span>Loading conversation...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 overflow-y-auto p-4 lg:p-6 space-y-4">
      {messages.map((message) => (
        <div key={message.id}>
          {message.role === 'user' ? (
            <div className="flex justify-end">
              <div className="max-w-[85%] lg:max-w-[70%] p-4 rounded-2xl bg-blue-600 text-white rounded-br-sm">
                <p className="text-base lg:text-lg whitespace-pre-wrap">
                  {message.content}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-gray-900 py-2">
              <MarkdownMessage content={message.content} />
              {message.planUpdated && (
                <div className="mt-2 pt-2 border-t border-green-200 text-sm text-green-600 flex items-center gap-1">
                  <span>&#10003;</span> Plan saved to your account
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      {loading && (
        <div className="text-gray-900 py-2">
          <div className="flex items-center gap-2">
            <div className="spinner" />
            <span className="text-gray-500">Thinking...</span>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}
