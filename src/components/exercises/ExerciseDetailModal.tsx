'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogPanel, DialogTitle, DialogBackdrop } from '@headlessui/react';
import type { LibraryExercise, ExerciseUpdate, MuscleGroup, EquipmentType, DifficultyLevel } from '@/types/exercise';
import {
  MUSCLE_GROUP_OPTIONS,
  EQUIPMENT_TYPE_OPTIONS,
  DIFFICULTY_OPTIONS,
  getMuscleGroupLabel,
  getEquipmentLabel,
  getDifficultyLabel,
} from '@/types/exercise';

interface ExerciseDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  exercise: LibraryExercise | null;
  onSave: (exerciseId: string, updates: ExerciseUpdate) => Promise<void>;
  onDelete: (exerciseId: string) => Promise<void>;
}

const difficultyColors = {
  beginner: 'bg-green-100 text-green-700',
  intermediate: 'bg-yellow-100 text-yellow-700',
  advanced: 'bg-red-100 text-red-700',
};

export function ExerciseDetailModal({
  isOpen,
  onClose,
  exercise,
  onSave,
  onDelete,
}: ExerciseDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  // Edit form state
  const [name, setName] = useState('');
  const [primaryMuscles, setPrimaryMuscles] = useState<MuscleGroup[]>([]);
  const [secondaryMuscles, setSecondaryMuscles] = useState<MuscleGroup[]>([]);
  const [equipmentRequired, setEquipmentRequired] = useState<EquipmentType[]>([]);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('beginner');
  const [instructions, setInstructions] = useState<string[]>([]);
  const [tips, setTips] = useState<string[]>([]);

  // Reset form when exercise changes
  useEffect(() => {
    if (exercise) {
      setName(exercise.name);
      setPrimaryMuscles([...exercise.primaryMuscles]);
      setSecondaryMuscles([...(exercise.secondaryMuscles || [])]);
      setEquipmentRequired([...exercise.equipmentRequired]);
      setDifficulty(exercise.difficulty);
      setInstructions([...exercise.instructions]);
      setTips([...(exercise.tips || [])]);
      setIsEditing(false);
    }
  }, [exercise]);

  const hasChanges = () => {
    if (!exercise) return false;
    return (
      name !== exercise.name ||
      JSON.stringify(primaryMuscles) !== JSON.stringify(exercise.primaryMuscles) ||
      JSON.stringify(secondaryMuscles) !== JSON.stringify(exercise.secondaryMuscles || []) ||
      JSON.stringify(equipmentRequired) !== JSON.stringify(exercise.equipmentRequired) ||
      difficulty !== exercise.difficulty ||
      JSON.stringify(instructions) !== JSON.stringify(exercise.instructions) ||
      JSON.stringify(tips) !== JSON.stringify(exercise.tips || [])
    );
  };

  const handleClose = () => {
    if (isEditing && hasChanges()) {
      setShowDiscardConfirm(true);
    } else {
      onClose();
    }
  };

  const handleDiscard = () => {
    if (exercise) {
      setName(exercise.name);
      setPrimaryMuscles([...exercise.primaryMuscles]);
      setSecondaryMuscles([...(exercise.secondaryMuscles || [])]);
      setEquipmentRequired([...exercise.equipmentRequired]);
      setDifficulty(exercise.difficulty);
      setInstructions([...exercise.instructions]);
      setTips([...(exercise.tips || [])]);
    }
    setIsEditing(false);
    setShowDiscardConfirm(false);
    onClose();
  };

  const handleSave = async () => {
    if (!exercise) return;

    setSaving(true);
    try {
      await onSave(exercise.id, {
        name,
        primaryMuscles,
        equipmentRequired,
        difficulty,
        instructions,
        ...(secondaryMuscles.length > 0 && { secondaryMuscles }),
        ...(tips.length > 0 && { tips }),
      });
      setIsEditing(false);
      onClose();
    } catch (error) {
      console.error('Error saving exercise:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!exercise) return;

    setSaving(true);
    try {
      await onDelete(exercise.id);
      setShowDeleteConfirm(false);
      onClose();
    } catch (error) {
      console.error('Error deleting exercise:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges()) {
      setShowDiscardConfirm(true);
    } else {
      if (exercise) {
        setName(exercise.name);
        setPrimaryMuscles([...exercise.primaryMuscles]);
        setSecondaryMuscles([...(exercise.secondaryMuscles || [])]);
        setEquipmentRequired([...exercise.equipmentRequired]);
        setDifficulty(exercise.difficulty);
        setInstructions([...exercise.instructions]);
        setTips([...(exercise.tips || [])]);
      }
      setIsEditing(false);
    }
  };

  const toggleMuscle = (muscle: MuscleGroup, isPrimary: boolean) => {
    if (isPrimary) {
      if (primaryMuscles.includes(muscle)) {
        setPrimaryMuscles(primaryMuscles.filter((m) => m !== muscle));
      } else {
        setPrimaryMuscles([...primaryMuscles, muscle]);
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
    setInstructions(instructions.filter((_, i) => i !== index));
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

  if (!exercise) return null;

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
          {/* Delete confirmation */}
          {showDeleteConfirm && (
            <div className="absolute inset-0 bg-white rounded-2xl z-10 flex items-center justify-center p-6">
              <div className="text-center">
                <p className="text-lg font-semibold text-gray-900 mb-2">Delete this exercise?</p>
                <p className="text-gray-600 mb-6">This action cannot be undone.</p>
                <div className="flex gap-3">
                  <button
                    onClick={handleDelete}
                    disabled={saving}
                    className="flex-1 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 disabled:opacity-50"
                  >
                    {saving ? 'Deleting...' : 'Delete'}
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={saving}
                    className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Discard changes confirmation */}
          {showDiscardConfirm && (
            <div className="absolute inset-0 bg-white rounded-2xl z-10 flex items-center justify-center p-6">
              <div className="text-center">
                <p className="text-lg font-semibold text-gray-900 mb-2">Discard changes?</p>
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
          <div className="flex items-start justify-between p-6 pb-4 border-b border-gray-100">
            <div className="flex-1">
              <DialogTitle className="text-xl font-bold text-gray-900">
                {isEditing ? 'Edit Exercise' : exercise.name}
              </DialogTitle>
              {isEditing && <p className="text-sm text-blue-600 mt-1">Editing</p>}
              {!isEditing && exercise.isCustom && (
                <p className="text-sm text-purple-600 mt-1">Custom Exercise</p>
              )}
            </div>

            <div className="flex items-center gap-2">
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium hover:bg-blue-200 transition-colors"
                >
                  Edit
                </button>
              )}
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
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {isEditing ? (
              // Edit mode
              <div className="space-y-6">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Exercise Name
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
                    Primary Muscles
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
                    Equipment Required
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
                    Instructions
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
                        <button
                          onClick={() => removeInstruction(index)}
                          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
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

                {/* Delete button */}
                <div className="pt-4 border-t border-gray-100">
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="text-sm text-red-600 hover:text-red-700 font-medium"
                  >
                    Delete this exercise
                  </button>
                </div>
              </div>
            ) : (
              // View mode
              <div className="space-y-6">
                {/* Difficulty badge */}
                <div>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                      difficultyColors[exercise.difficulty]
                    }`}
                  >
                    {getDifficultyLabel(exercise.difficulty)}
                  </span>
                </div>

                {/* Primary muscles */}
                <div>
                  <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
                    Primary Muscles
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {exercise.primaryMuscles.map((muscle) => (
                      <span
                        key={muscle}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium"
                      >
                        {getMuscleGroupLabel(muscle)}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Secondary muscles */}
                {exercise.secondaryMuscles && exercise.secondaryMuscles.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
                      Secondary Muscles
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {exercise.secondaryMuscles.map((muscle) => (
                        <span
                          key={muscle}
                          className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium"
                        >
                          {getMuscleGroupLabel(muscle)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Equipment */}
                <div>
                  <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
                    Equipment
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {exercise.equipmentRequired.map((equipment) => (
                      <span
                        key={equipment}
                        className="px-3 py-1 bg-amber-100 text-amber-700 rounded-lg text-sm font-medium"
                      >
                        {getEquipmentLabel(equipment)}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Instructions */}
                <div>
                  <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
                    Instructions
                  </h4>
                  <ol className="space-y-2">
                    {exercise.instructions.map((instruction, index) => (
                      <li key={index} className="flex gap-3">
                        <span className="text-blue-600 font-semibold">{index + 1}.</span>
                        <span className="text-gray-700">{instruction}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Tips */}
                {exercise.tips && exercise.tips.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
                      Tips
                    </h4>
                    <ul className="space-y-2">
                      {exercise.tips.map((tip, index) => (
                        <li key={index} className="flex gap-3">
                          <span className="text-green-600">•</span>
                          <span className="text-gray-700">{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer - only in edit mode */}
          {isEditing && (
            <div className="p-6 pt-4 border-t border-gray-100">
              <div className="flex gap-3">
                <button
                  onClick={handleSave}
                  disabled={saving || !name.trim() || primaryMuscles.length === 0 || equipmentRequired.length === 0 || instructions.length === 0}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={saving}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </DialogPanel>
      </div>
    </Dialog>
  );
}
