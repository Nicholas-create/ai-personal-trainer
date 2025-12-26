'use client';

import { useProfileField } from '@/hooks/useProfileField';
import { SaveIndicator } from './SaveIndicator';

interface Option {
  id: number;
  label: string;
}

interface EditableSessionLengthProps {
  currentValue: number;
  options: readonly Option[];
  userId: string;
  refreshUser: () => Promise<void>;
}

export function EditableSessionLength({
  currentValue,
  options,
  userId,
  refreshUser,
}: EditableSessionLengthProps) {
  const { saveStatus, save } = useProfileField<number>({
    userId,
    fieldName: 'sessionLength',
    currentValue,
    refreshUser,
  });

  const handleSelect = async (value: number) => {
    if (value !== currentValue) {
      await save(value);
    }
  };

  return (
    <div className="p-3 lg:p-2 bg-gray-50 rounded-xl">
      <div className="flex items-center justify-between mb-2">
        <p className="text-gray-500 text-xs">Session Length</p>
        <SaveIndicator status={saveStatus} />
      </div>
      <div className="flex rounded-lg bg-gray-200 p-0.5">
        {options.map((option) => (
          <button
            key={option.id}
            onClick={() => handleSelect(option.id)}
            disabled={saveStatus === 'saving'}
            className={`flex-1 py-1.5 px-2 text-sm font-medium rounded-md transition-all ${
              option.id === currentValue
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            } ${saveStatus === 'saving' ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {option.id}m
          </button>
        ))}
      </div>
    </div>
  );
}
