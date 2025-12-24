export interface PlanExercise {
  id: string;
  name: string;
  sets: number;
  reps: number;
  notes?: string;
}

export interface DaySchedule {
  dayOfWeek: string;
  workoutType: 'upper_body' | 'lower_body' | 'full_body' | 'cardio' | 'rest';
  workoutName: string;
  exercises: PlanExercise[];
}

export interface WorkoutPlan {
  id: string;
  userId: string;
  generatedAt: Date;
  generatedBy: 'claude';
  active: boolean;
  workoutSchedule: DaySchedule[];
  validUntil: Date;
}

export interface TodayWorkout {
  name: string;
  exercises: PlanExercise[];
  estimatedDuration: number;
  isRestDay: boolean;
}
