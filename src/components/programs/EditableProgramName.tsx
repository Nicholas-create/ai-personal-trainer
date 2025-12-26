'use client';

import { useState, useRef, useEffect } from 'react';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface EditableProgramNameProps {
  name: string;
  onSave: (name: string) => Promise<void>;
}

export function EditableProgramName({ name, onSave }: EditableProgramNameProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(name);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setValue(name);
  }, [name]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    if (saveStatus === 'saved') {
      const timer = setTimeout(() => setSaveStatus('idle'), 2000);
      return () => clearTimeout(timer);
    }
  }, [saveStatus]);

  const handleSave = async () => {
    const trimmed = value.trim();
    if (!trimmed || trimmed === name) {
      setValue(name);
      setIsEditing(false);
      return;
    }

    setSaveStatus('saving');
    try {
      await onSave(trimmed);
      setSaveStatus('saved');
      setIsEditing(false);
    } catch {
      setSaveStatus('error');
    }
  };

  const handleCancel = () => {
    setValue(name);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (!isEditing) {
    return (
      <div className="flex items-center gap-2">
        <h3
          onClick={() => setIsEditing(true)}
          className="text-xl font-bold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
        >
          {name}
        </h3>
        <button
          onClick={() => setIsEditing(true)}
          className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Edit name"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
            />
          </svg>
        </button>
        {saveStatus === 'saved' && (
          <span className="text-xs text-green-600 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Saved
          </span>
        )}
        {saveStatus === 'error' && (
          <span className="text-xs text-red-600">Failed to save</span>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        className="text-xl font-bold text-gray-900 bg-white border-2 border-blue-400 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-200"
        disabled={saveStatus === 'saving'}
      />
      <button
        onClick={handleSave}
        disabled={saveStatus === 'saving'}
        className="px-3 py-1 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {saveStatus === 'saving' ? 'Saving...' : 'Save'}
      </button>
      <button
        onClick={handleCancel}
        disabled={saveStatus === 'saving'}
        className="px-3 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
      >
        Cancel
      </button>
    </div>
  );
}
