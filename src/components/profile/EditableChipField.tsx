'use client';

import { useState, useEffect } from 'react';
import { useProfileField, type SaveStatus } from '@/hooks/useProfileField';
import { SaveIndicator } from './SaveIndicator';
import type { UserProfile } from '@/types/user';

interface Option {
  id: string;
  label: string;
}

interface EditableChipFieldProps {
  label: string;
  fieldName: keyof UserProfile;
  currentValues: string[];
  allOptions: readonly Option[];
  colorScheme: 'blue' | 'amber' | 'green';
  userId: string;
  refreshUser: () => Promise<void>;
  emptyText?: string;
  allowCustom?: boolean;
  customPlaceholder?: string;
}

const colorClasses = {
  blue: {
    selected: 'bg-blue-100 text-blue-700 border-blue-200',
    unselected: 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100',
  },
  amber: {
    selected: 'bg-amber-100 text-amber-700 border-amber-200',
    unselected: 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100',
  },
  green: {
    selected: 'bg-green-100 text-green-700 border-green-200',
    unselected: 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100',
  },
};

export function EditableChipField({
  label,
  fieldName,
  currentValues,
  allOptions,
  colorScheme,
  userId,
  refreshUser,
  emptyText = 'None selected',
  allowCustom = false,
  customPlaceholder = 'Add custom...',
}: EditableChipFieldProps) {
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
    fieldName,
    currentValue: currentValues,
    refreshUser,
  });

  const [customInput, setCustomInput] = useState('');

  // Sync pendingValue when currentValues change (e.g., after save)
  useEffect(() => {
    if (!isEditing) {
      setPendingValue(currentValues);
    }
  }, [currentValues, isEditing, setPendingValue]);

  // Get all predefined option IDs for comparison
  const predefinedIds = allOptions.map((o) => o.id);

  // Separate custom values from predefined values
  const customValues = pendingValue.filter((v) => !predefinedIds.includes(v));

  const toggleValue = (id: string) => {
    if (pendingValue.includes(id)) {
      // If removing 'none', just remove it
      // If removing other value when 'none' is selected, also remove 'none'
      const newValue = pendingValue.filter((v) => v !== id && v !== 'none');
      setPendingValue(newValue.length > 0 ? newValue : []);
    } else {
      // If selecting 'none', clear everything else
      if (id === 'none') {
        setPendingValue(['none']);
      } else {
        // If selecting a value, remove 'none' if present
        setPendingValue([...pendingValue.filter((v) => v !== 'none'), id]);
      }
    }
  };

  const addCustomValue = () => {
    const trimmed = customInput.trim();
    if (trimmed && !pendingValue.includes(trimmed)) {
      // Remove 'none' if present when adding a custom value
      setPendingValue([...pendingValue.filter((v) => v !== 'none'), trimmed]);
      setCustomInput('');
    }
  };

  const removeCustomValue = (value: string) => {
    setPendingValue(pendingValue.filter((v) => v !== value));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCustomValue();
    }
  };

  const hasChanges = JSON.stringify(pendingValue.sort()) !== JSON.stringify([...currentValues].sort());

  const handleSave = () => {
    save(pendingValue);
  };

  const colors = colorClasses[colorScheme];

  // Read mode
  if (!isEditing) {
    return (
      <div
        className="bg-white rounded-2xl p-4 lg:p-3 shadow-sm cursor-pointer hover:shadow-md transition-shadow group"
        onClick={() => setIsEditing(true)}
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold text-gray-500">{label}</h3>
          <div className="flex items-center">
            <SaveIndicator status={saveStatus} />
            <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
              Click to edit
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {currentValues.length > 0 ? (
            currentValues.map((value) => {
              const option = allOptions.find((o) => o.id === value);
              return (
                <span
                  key={value}
                  className={`px-3 py-1.5 rounded-full font-medium text-sm border ${colors.selected}`}
                >
                  {option?.label || value.replace('_', ' ')}
                </span>
              );
            })
          ) : (
            <span className="text-gray-500 text-sm">{emptyText}</span>
          )}
        </div>
      </div>
    );
  }

  // Edit mode
  return (
    <div className="bg-white rounded-2xl p-4 lg:p-3 shadow-md ring-2 ring-blue-200">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold text-gray-500">{label}</h3>
        <span className="text-xs text-blue-600 font-medium">Editing</span>
      </div>

      {/* Predefined options */}
      <div className="flex flex-wrap gap-2 mb-3">
        {allOptions.map((option) => {
          const isSelected = pendingValue.includes(option.id);
          return (
            <button
              key={option.id}
              onClick={() => toggleValue(option.id)}
              className={`px-3 py-1.5 rounded-full font-medium text-sm border transition-colors ${
                isSelected ? colors.selected : colors.unselected
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {/* Custom values display */}
      {allowCustom && customValues.length > 0 && (
        <div className="mb-3">
          <p className="text-xs text-gray-500 mb-1.5">Your custom items:</p>
          <div className="flex flex-wrap gap-2">
            {customValues.map((value) => (
              <span
                key={value}
                className={`px-3 py-1.5 rounded-full font-medium text-sm border ${colors.selected} flex items-center gap-1.5`}
              >
                {value}
                <button
                  onClick={() => removeCustomValue(value)}
                  className="hover:opacity-70 transition-opacity"
                  aria-label={`Remove ${value}`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Custom input */}
      {allowCustom && (
        <div className="mb-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={customPlaceholder}
              className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
            />
            <button
              onClick={addCustomValue}
              disabled={!customInput.trim()}
              className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add
            </button>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2">
        <button
          onClick={cancel}
          className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={!hasChanges || saveStatus === 'saving'}
          className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saveStatus === 'saving' ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );
}
