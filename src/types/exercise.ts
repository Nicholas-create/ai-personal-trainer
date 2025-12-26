// Exercise Library Types

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'core'
  | 'quadriceps'
  | 'hamstrings'
  | 'glutes'
  | 'calves'
  | 'forearms'
  | 'full_body';

export type EquipmentType =
  | 'none'
  | 'dumbbells'
  | 'barbell'
  | 'kettlebell'
  | 'resistance_bands'
  | 'cable_machine'
  | 'bench'
  | 'pull_up_bar'
  | 'machine'
  | 'medicine_ball'
  | 'stability_ball';

export interface LibraryExercise {
  id: string;
  name: string;

  // Categorization
  primaryMuscles: MuscleGroup[];
  secondaryMuscles?: MuscleGroup[];
  equipmentRequired: EquipmentType[];
  difficulty: DifficultyLevel;

  // Instructions
  instructions: string[];
  tips?: string[];

  // Media (optional)
  imageUrl?: string;
  videoUrl?: string;

  // Tracking
  isCustom: boolean;
  isDefault: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

// Type for creating a new exercise (without id and createdAt)
export type NewExercise = Omit<LibraryExercise, 'id' | 'createdAt'>;

// Type for updating an exercise
export type ExerciseUpdate = Partial<Omit<LibraryExercise, 'id' | 'createdAt' | 'isDefault'>>;

// Filter options for searching
export interface ExerciseFilters {
  muscleGroup?: MuscleGroup;
  equipment?: EquipmentType;
  difficulty?: DifficultyLevel;
  searchTerm?: string;
}

// UI Option types (following onboarding.ts pattern)
export const MUSCLE_GROUP_OPTIONS = [
  { id: 'chest' as const, label: 'Chest' },
  { id: 'back' as const, label: 'Back' },
  { id: 'shoulders' as const, label: 'Shoulders' },
  { id: 'biceps' as const, label: 'Biceps' },
  { id: 'triceps' as const, label: 'Triceps' },
  { id: 'core' as const, label: 'Core/Abs' },
  { id: 'quadriceps' as const, label: 'Quadriceps' },
  { id: 'hamstrings' as const, label: 'Hamstrings' },
  { id: 'glutes' as const, label: 'Glutes' },
  { id: 'calves' as const, label: 'Calves' },
  { id: 'forearms' as const, label: 'Forearms' },
  { id: 'full_body' as const, label: 'Full Body' },
] as const;

export const EQUIPMENT_TYPE_OPTIONS = [
  { id: 'none' as const, label: 'No Equipment (Bodyweight)' },
  { id: 'dumbbells' as const, label: 'Dumbbells' },
  { id: 'barbell' as const, label: 'Barbell' },
  { id: 'kettlebell' as const, label: 'Kettlebell' },
  { id: 'resistance_bands' as const, label: 'Resistance Bands' },
  { id: 'cable_machine' as const, label: 'Cable Machine' },
  { id: 'bench' as const, label: 'Bench' },
  { id: 'pull_up_bar' as const, label: 'Pull-up Bar' },
  { id: 'machine' as const, label: 'Weight Machine' },
  { id: 'medicine_ball' as const, label: 'Medicine Ball' },
  { id: 'stability_ball' as const, label: 'Stability Ball' },
] as const;

export const DIFFICULTY_OPTIONS = [
  { id: 'beginner' as const, label: 'Beginner', description: 'Safe and easy to perform' },
  { id: 'intermediate' as const, label: 'Intermediate', description: 'Requires some experience' },
  { id: 'advanced' as const, label: 'Advanced', description: 'Complex movements' },
] as const;

// Helper to get label for a muscle group
export function getMuscleGroupLabel(id: MuscleGroup): string {
  return MUSCLE_GROUP_OPTIONS.find((opt) => opt.id === id)?.label || id;
}

// Helper to get label for equipment type
export function getEquipmentLabel(id: EquipmentType): string {
  return EQUIPMENT_TYPE_OPTIONS.find((opt) => opt.id === id)?.label || id;
}

// Helper to get label for difficulty
export function getDifficultyLabel(id: DifficultyLevel): string {
  return DIFFICULTY_OPTIONS.find((opt) => opt.id === id)?.label || id;
}
