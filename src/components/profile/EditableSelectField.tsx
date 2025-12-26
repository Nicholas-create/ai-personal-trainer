'use client';

import { useState, useEffect, useRef } from 'react';
import { useProfileField } from '@/hooks/useProfileField';
import { SaveIndicator } from './SaveIndicator';
import type { UserProfile } from '@/types/user';

interface Option {
  id: string;
  label: string;
  description?: string;
}

interface EditableSelectFieldProps {
  label: string;
  fieldName: keyof UserProfile;
  currentValue: string;
  options: readonly Option[];
  userId: string;
  refreshUser: () => Promise<void>;
}

export function EditableSelectField({
  label,
  fieldName,
  currentValue,
  options,
  userId,
  refreshUser,
}: EditableSelectFieldProps) {
  const {
    isEditing,
    setIsEditing,
    saveStatus,
    save,
    cancel,
  } = useProfileField<string>({
    userId,
    fieldName,
    currentValue,
    refreshUser,
  });

  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isEditing) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        cancel();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isEditing, cancel]);

  const handleSelect = async (value: string) => {
    if (value !== currentValue) {
      await save(value);
    } else {
      setIsEditing(false);
    }
  };

  const currentOption = options.find((o) => o.id === currentValue);
  const displayValue = currentOption?.label || currentValue?.replace('_', ' ') || 'Not set';

  // Read mode
  if (!isEditing) {
    return (
      <div
        ref={containerRef}
        className="p-3 lg:p-2 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors group"
        onClick={() => setIsEditing(true)}
      >
        <div className="flex items-center justify-between">
          <p className="text-gray-500 text-xs">{label}</p>
          <SaveIndicator status={saveStatus} />
        </div>
        <div className="flex items-center justify-between">
          <p className="font-semibold text-gray-900 text-sm">{displayValue}</p>
          <svg
            className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    );
  }

  // Edit mode - inline dropdown
  return (
    <div
      ref={containerRef}
      className="p-3 lg:p-2 bg-white rounded-xl ring-2 ring-blue-200 shadow-lg relative z-10"
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-gray-500 text-xs">{label}</p>
        <span className="text-xs text-blue-600 font-medium">Select</span>
      </div>
      <div className="space-y-1">
        {options.map((option) => (
          <button
            key={option.id}
            onClick={() => handleSelect(option.id)}
            disabled={saveStatus === 'saving'}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
              option.id === currentValue
                ? 'bg-blue-100 text-blue-700 font-medium'
                : 'hover:bg-gray-100 text-gray-700'
            } ${saveStatus === 'saving' ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span className="block">{option.label}</span>
            {option.description && (
              <span className="block text-xs text-gray-500 mt-0.5">{option.description}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
