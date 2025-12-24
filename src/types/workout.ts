export interface CompletedSet {
  reps: number;
  weight: number;
  completed: boolean;
}

export interface Exercise {
  id: string;
  name: string;
  targetSets: number;
  targetReps: number;
  completedSets: CompletedSet[];
  skipped: boolean;
  skipReason?: string;
  notes?: string;
}

export interface Workout {
  id: string;
  userId: string;
  date: Date;
  planId: string;
  name: string;
  exercises: Exercise[];
  completed: boolean;
  duration: number;
  notes?: string;
  effort?: number;
}

export interface WorkoutSummary {
  id: string;
  date: Date;
  name: string;
  exerciseCount: number;
  duration: number;
  completionRate: number;
}
