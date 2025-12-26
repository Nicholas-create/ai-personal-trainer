'use client';

import type { LibraryExercise } from '@/types/exercise';
import { getMuscleGroupLabel, getEquipmentLabel } from '@/types/exercise';

interface ExerciseCardProps {
  exercise: LibraryExercise;
  onClick: () => void;
}

const difficultyColors = {
  beginner: 'bg-green-100 text-green-700',
  intermediate: 'bg-yellow-100 text-yellow-700',
  advanced: 'bg-red-100 text-red-700',
};

export function ExerciseCard({ exercise, onClick }: ExerciseCardProps) {
  const primaryMuscleLabels = exercise.primaryMuscles
    .slice(0, 2)
    .map(getMuscleGroupLabel)
    .join(', ');

  const primaryEquipment = exercise.equipmentRequired[0];
  const equipmentLabel = primaryEquipment
    ? getEquipmentLabel(primaryEquipment)
    : 'Bodyweight';

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow border border-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 min-h-[100px]"
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-semibold text-gray-900 text-base leading-tight">
          {exercise.name}
        </h3>
        <span
          className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${
            difficultyColors[exercise.difficulty]
          }`}
        >
          {exercise.difficulty.charAt(0).toUpperCase() +
            exercise.difficulty.slice(1)}
        </span>
      </div>

      {/* Muscle groups */}
      <p className="text-sm text-gray-600 mb-2">
        {primaryMuscleLabels}
        {exercise.primaryMuscles.length > 2 && (
          <span className="text-gray-400">
            {' '}
            +{exercise.primaryMuscles.length - 2} more
          </span>
        )}
      </p>

      {/* Equipment badge */}
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center px-2 py-1 rounded-lg bg-gray-100 text-gray-600 text-xs font-medium">
          {equipmentLabel}
        </span>
        {exercise.isCustom && (
          <span className="inline-flex items-center px-2 py-1 rounded-lg bg-purple-100 text-purple-600 text-xs font-medium">
            Custom
          </span>
        )}
      </div>
    </button>
  );
}
