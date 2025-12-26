'use client';

import { useState } from 'react';
import { Dialog, DialogPanel, DialogTitle, DialogBackdrop } from '@headlessui/react';
import type { NewExercise, MuscleGroup, EquipmentType, DifficultyLevel } from '@/types/exercise';
import {
  MUSCLE_GROUP_OPTIONS,
  EQUIPMENT_TYPE_OPTIONS,
  DIFFICULTY_OPTIONS,
} from '@/types/exercise';

interface CreateExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (exercise: NewExercise) => Promise<string>;
}

const difficultyColors = {
  beginner: 'bg-green-100 text-green-700',
  intermediate: 'bg-yellow-100 text-yellow-700',
  advanced: 'bg-red-100 text-red-700',
};

export function CreateExerciseModal({ isOpen, onClose, onSave }: CreateExerciseModalProps) {
  const [saving, setSaving] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [primaryMuscles, setPrimaryMuscles] = useState<MuscleGroup[]>([]);
  const [secondaryMuscles, setSecondaryMuscles] = useState<MuscleGroup[]>([]);
  const [equipmentRequired, setEquipmentRequired] = useState<EquipmentType[]>([]);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('beginner');
  const [instructions, setInstructions] = useState<string[]>(['']);
  const [tips, setTips] = useState<string[]>([]);

  const resetForm = () => {
    setName('');
    setPrimaryMuscles([]);
    setSecondaryMuscles([]);
    setEquipmentRequired([]);
    setDifficulty('beginner');
    setInstructions(['']);
    setTips([]);
  };

  const hasContent = () => {
    return (
      name.trim() ||
      primaryMuscles.length > 0 ||
      secondaryMuscles.length > 0 ||
      equipmentRequired.length > 0 ||
      instructions.some((i) => i.trim()) ||
      tips.some((t) => t.trim())
    );
  };

  const handleClose = () => {
    if (hasContent()) {
      setShowDiscardConfirm(true);
    } else {
      resetForm();
      onClose();
    }
  };

  const handleDiscard = () => {
    resetForm();
    setShowDiscardConfirm(false);
    onClose();
  };

  const handleSave = async () => {
    // Filter out empty instructions and tips
    const filteredInstructions = instructions.filter((i) => i.trim());
    const filteredTips = tips.filter((t) => t.trim());

    if (
      !name.trim() ||
      primaryMuscles.length === 0 ||
      equipmentRequired.length === 0 ||
      filteredInstructions.length === 0
    ) {
      return;
    }

    setSaving(true);
    try {
      const exercise: NewExercise = {
        name: name.trim(),
        primaryMuscles,
        equipmentRequired,
        difficulty,
        instructions: filteredInstructions,
        isCustom: true,
        isDefault: false,
        ...(secondaryMuscles.length > 0 && { secondaryMuscles }),
        ...(filteredTips.length > 0 && { tips: filteredTips }),
      };

      await onSave(exercise);
      resetForm();
      onClose();
    } catch (error) {
      console.error('Error creating exercise:', error);
    } finally {
      setSaving(false);
    }
  };

  const toggleMuscle = (muscle: MuscleGroup, isPrimary: boolean) => {
    if (isPrimary) {
      if (primaryMuscles.includes(muscle)) {
        setPrimaryMuscles(primaryMuscles.filter((m) => m !== muscle));
      } else {
        setPrimaryMuscles([...primaryMuscles, muscle]);
        // Remove from secondary if adding to primary
        setSecondaryMuscles(secondaryMuscles.filter((m) => m !== muscle));
      }
    } else {
      if (secondaryMuscles.includes(muscle)) {
        setSecondaryMuscles(secondaryMuscles.filter((m) => m !== muscle));
      } else {
        setSecondaryMuscles([...secondaryMuscles, muscle]);
      }
    }
  };

  const toggleEquipment = (equipment: EquipmentType) => {
    if (equipmentRequired.includes(equipment)) {
      setEquipmentRequired(equipmentRequired.filter((e) => e !== equipment));
    } else {
      setEquipmentRequired([...equipmentRequired, equipment]);
    }
  };

  const updateInstruction = (index: number, value: string) => {
    const updated = [...instructions];
    updated[index] = value;
    setInstructions(updated);
  };

  const addInstruction = () => {
    setInstructions([...instructions, '']);
  };

  const removeInstruction = (index: number) => {
    if (instructions.length > 1) {
      setInstructions(instructions.filter((_, i) => i !== index));
    }
  };

  const updateTip = (index: number, value: string) => {
    const updated = [...tips];
    updated[index] = value;
    setTips(updated);
  };

  const addTip = () => {
    setTips([...tips, '']);
  };

  const removeTip = (index: number) => {
    setTips(tips.filter((_, i) => i !== index));
  };

  const isValid =
    name.trim() &&
    primaryMuscles.length > 0 &&
    equipmentRequired.length > 0 &&
    instructions.some((i) => i.trim());

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-black/50 transition-opacity duration-200 data-[closed]:opacity-0"
      />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel
          transition
          className="w-full max-w-2xl bg-white rounded-2xl shadow-xl transform transition-all duration-200 data-[closed]:scale-95 data-[closed]:opacity-0 max-h-[90vh] flex flex-col"
        >
          {/* Discard confirmation */}
          {showDiscardConfirm && (
            <div className="absolute inset-0 bg-white rounded-2xl z-10 flex items-center justify-center p-6">
              <div className="text-center">
                <p className="text-lg font-semibold text-gray-900 mb-2">Discard exercise?</p>
                <p className="text-gray-600 mb-6">Your unsaved changes will be lost.</p>
                <div className="flex gap-3">
                  <button
                    onClick={handleDiscard}
                    className="flex-1 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700"
                  >
                    Discard
                  </button>
                  <button
                    onClick={() => setShowDiscardConfirm(false)}
                    className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200"
                  >
                    Keep Editing
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Header */}
          <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-100">
            <DialogTitle className="text-xl font-bold text-gray-900">
              Create New Exercise
            </DialogTitle>
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Exercise Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                  placeholder="e.g., Dumbbell Bicep Curls"
                />
              </div>

              {/* Difficulty */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Difficulty Level
                </label>
                <div className="flex gap-2">
                  {DIFFICULTY_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setDifficulty(option.id)}
                      className={`flex-1 py-2 px-3 rounded-lg font-medium transition-colors ${
                        difficulty === option.id
                          ? difficultyColors[option.id]
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Primary Muscles */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Primary Muscles <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {MUSCLE_GROUP_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => toggleMuscle(option.id, true)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        primaryMuscles.includes(option.id)
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Secondary Muscles */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Secondary Muscles (optional)
                </label>
                <div className="flex flex-wrap gap-2">
                  {MUSCLE_GROUP_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => toggleMuscle(option.id, false)}
                      disabled={primaryMuscles.includes(option.id)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        secondaryMuscles.includes(option.id)
                          ? 'bg-purple-100 text-purple-700'
                          : primaryMuscles.includes(option.id)
                          ? 'bg-gray-50 text-gray-300 cursor-not-allowed'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Equipment */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Equipment Required <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {EQUIPMENT_TYPE_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => toggleEquipment(option.id)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        equipmentRequired.includes(option.id)
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Instructions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Instructions <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  {instructions.map((instruction, index) => (
                    <div key={index} className="flex gap-2">
                      <span className="text-gray-400 py-2 w-6 text-center">
                        {index + 1}.
                      </span>
                      <input
                        type="text"
                        value={instruction}
                        onChange={(e) => updateInstruction(index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                        placeholder="Enter instruction..."
                      />
                      {instructions.length > 1 && (
                        <button
                          onClick={() => removeInstruction(index)}
                          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={addInstruction}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    + Add instruction
                  </button>
                </div>
              </div>

              {/* Tips */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tips (optional)
                </label>
                <div className="space-y-2">
                  {tips.map((tip, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={tip}
                        onChange={(e) => updateTip(index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                        placeholder="Enter tip..."
                      />
                      <button
                        onClick={() => removeTip(index)}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={addTip}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    + Add tip
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 pt-4 border-t border-gray-100">
            <div className="flex gap-3">
              <button
                onClick={handleSave}
                disabled={saving || !isValid}
                className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? 'Creating...' : 'Create Exercise'}
              </button>
              <button
                onClick={handleClose}
                disabled={saving}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
