'use client';

import { useState, useEffect } from 'react';
import { useProfileField } from '@/hooks/useProfileField';
import { SaveIndicator } from './SaveIndicator';

interface Option {
  id: string;
  label: string;
}

interface EditableDaysFieldProps {
  currentValues: string[];
  options: readonly Option[];
  userId: string;
  refreshUser: () => Promise<void>;
}

const dayAbbreviations: Record<string, string> = {
  monday: 'M',
  tuesday: 'T',
  wednesday: 'W',
  thursday: 'T',
  friday: 'F',
  saturday: 'S',
  sunday: 'S',
};

export function EditableDaysField({
  currentValues,
  options,
  userId,
  refreshUser,
}: EditableDaysFieldProps) {
  const {
    isEditing,
    setIsEditing,
    pendingValue,
    setPendingValue,
    saveStatus,
    save,
    cancel,
  } = useProfileField<string[]>({
    userId,
    fieldName: 'workoutDays',
    currentValue: currentValues,
    refreshUser,
  });

  // Sync pendingValue when currentValues change
  useEffect(() => {
    if (!isEditing) {
      setPendingValue(currentValues);
    }
  }, [currentValues, isEditing, setPendingValue]);

  const toggleDay = (dayId: string) => {
    if (pendingValue.includes(dayId)) {
      setPendingValue(pendingValue.filter((d) => d !== dayId));
    } else {
      setPendingValue([...pendingValue, dayId]);
    }
  };

  const hasChanges = JSON.stringify(pendingValue.sort()) !== JSON.stringify([...currentValues].sort());

  const handleSave = () => {
    save(pendingValue);
  };

  // Read mode
  if (!isEditing) {
    const displayDays = currentValues
      .map((day) => day.charAt(0).toUpperCase() + day.slice(1, 3))
      .join(', ');

    return (
      <div
        className="p-3 lg:p-2 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors group"
        onClick={() => setIsEditing(true)}
      >
        <div className="flex items-center justify-between">
          <p className="text-gray-500 text-xs">Workout Days</p>
          <SaveIndicator status={saveStatus} />
        </div>
        <div className="flex items-center justify-between">
          <p className="font-semibold text-gray-900 text-sm">
            {displayDays || 'Not set'}
          </p>
          <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
            Edit
          </span>
        </div>
      </div>
    );
  }

  // Edit mode
  return (
    <div className="p-3 lg:p-2 bg-white rounded-xl ring-2 ring-blue-200 shadow-lg col-span-2">
      <div className="flex items-center justify-between mb-2">
        <p className="text-gray-500 text-xs">Workout Days</p>
        <span className="text-xs text-blue-600 font-medium">Editing</span>
      </div>
      <div className="flex gap-1 mb-3">
        {options.map((option, index) => {
          const isSelected = pendingValue.includes(option.id);
          // Use unique key with index since some days have same abbreviation (T, T and S, S)
          return (
            <button
              key={option.id}
              onClick={() => toggleDay(option.id)}
              title={option.label}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                isSelected
                  ? 'bg-green-100 text-green-700 border-2 border-green-300'
                  : 'bg-gray-100 text-gray-500 border-2 border-transparent hover:bg-gray-200'
              }`}
            >
              {dayAbbreviations[option.id] || option.label.charAt(0)}
            </button>
          );
        })}
      </div>
      <div className="flex justify-end gap-2">
        <button
          onClick={cancel}
          className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={!hasChanges || saveStatus === 'saving' || pendingValue.length === 0}
          className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saveStatus === 'saving' ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );
}
