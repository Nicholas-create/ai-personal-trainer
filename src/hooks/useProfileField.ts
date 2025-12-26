'use client';

import { useState, useCallback } from 'react';
import { updateUserProfileField } from '@/lib/firebase/firestore';
import type { UserProfile } from '@/types/user';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface UseProfileFieldOptions<T> {
  userId: string;
  fieldName: keyof UserProfile;
  currentValue: T;
  refreshUser: () => Promise<void>;
}

interface UseProfileFieldReturn<T> {
  isEditing: boolean;
  setIsEditing: (v: boolean) => void;
  pendingValue: T;
  setPendingValue: (v: T) => void;
  saveStatus: SaveStatus;
  save: (value: T) => Promise<void>;
  cancel: () => void;
}

export function useProfileField<T>({
  userId,
  fieldName,
  currentValue,
  refreshUser,
}: UseProfileFieldOptions<T>): UseProfileFieldReturn<T> {
  const [isEditing, setIsEditing] = useState(false);
  const [pendingValue, setPendingValue] = useState<T>(currentValue);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

  const save = useCallback(async (value: T) => {
    setSaveStatus('saving');

    try {
      await updateUserProfileField(userId, fieldName, value as UserProfile[keyof UserProfile]);
      await refreshUser();
      setSaveStatus('saved');
      setIsEditing(false);

      // Auto-dismiss success indicator after 2s
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Failed to save profile field:', error);
      setSaveStatus('error');
      // Revert to current value on error
      setPendingValue(currentValue);
    }
  }, [userId, fieldName, refreshUser, currentValue]);

  const cancel = useCallback(() => {
    setPendingValue(currentValue);
    setIsEditing(false);
    setSaveStatus('idle');
  }, [currentValue]);

  return {
    isEditing,
    setIsEditing,
    pendingValue,
    setPendingValue,
    saveStatus,
    save,
    cancel,
  };
}
