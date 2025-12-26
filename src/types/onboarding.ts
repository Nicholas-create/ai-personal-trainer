export interface OnboardingState {
  goals: string[] | null;
  limitations: string[] | null;
  equipment: string | null;
  experienceLevel: string | null;
  workoutDays: string[] | null;
  sessionLength: number | null;
  units: string | null;
}

export const GOAL_OPTIONS = [
  { id: 'strength', label: 'Build Strength' },
  { id: 'mobility', label: 'Improve Mobility' },
  { id: 'weight_loss', label: 'Lose Weight' },
  { id: 'endurance', label: 'Build Endurance' },
  { id: 'rehabilitation', label: 'Rehabilitation' },
  { id: 'general', label: 'General Fitness' },
] as const;

export const LIMITATION_OPTIONS = [
  { id: 'knee', label: 'Knee Issues' },
  { id: 'back', label: 'Back Problems' },
  { id: 'shoulder', label: 'Shoulder Issues' },
  { id: 'hip', label: 'Hip Problems' },
  { id: 'wrist', label: 'Wrist/Hand Issues' },
  { id: 'none', label: 'No Limitations' },
] as const;

export const EQUIPMENT_OPTIONS = [
  { id: 'full_gym', label: 'Full Gym Access', description: 'Machines, free weights, cables' },
  { id: 'home', label: 'Home Equipment', description: 'Dumbbells, resistance bands, bench' },
  { id: 'minimal', label: 'Minimal/Bodyweight', description: 'Little to no equipment' },
] as const;

export const EXPERIENCE_OPTIONS = [
  { id: 'beginner', label: 'Beginner', description: 'New to exercise or returning after a long break' },
  { id: 'intermediate', label: 'Intermediate', description: 'Some experience, know basic exercises' },
  { id: 'advanced', label: 'Advanced', description: 'Very experienced, comfortable with complex movements' },
] as const;

export const DAY_OPTIONS = [
  { id: 'monday', label: 'Monday' },
  { id: 'tuesday', label: 'Tuesday' },
  { id: 'wednesday', label: 'Wednesday' },
  { id: 'thursday', label: 'Thursday' },
  { id: 'friday', label: 'Friday' },
  { id: 'saturday', label: 'Saturday' },
  { id: 'sunday', label: 'Sunday' },
] as const;

export const SESSION_LENGTH_OPTIONS = [
  { id: 30, label: '30 minutes' },
  { id: 45, label: '45 minutes' },
  { id: 60, label: '60 minutes' },
] as const;

export const UNIT_OPTIONS = [
  { id: 'lbs', label: 'Pounds (lbs)' },
  { id: 'kg', label: 'Kilograms (kg)' },
] as const;

export const VALID_GOALS: string[] = GOAL_OPTIONS.map(g => g.id);
export const VALID_LIMITATIONS: string[] = LIMITATION_OPTIONS.map(l => l.id);
export const VALID_EQUIPMENT: string[] = EQUIPMENT_OPTIONS.map(e => e.id);
export const VALID_EXPERIENCE: string[] = EXPERIENCE_OPTIONS.map(e => e.id);
export const VALID_DAYS: string[] = DAY_OPTIONS.map(d => d.id);
export const VALID_SESSION_LENGTHS: number[] = SESSION_LENGTH_OPTIONS.map(s => s.id);
export const VALID_UNITS: string[] = UNIT_OPTIONS.map(u => u.id);

export interface OnboardingChatResponse {
  message: string;
  extractedData: { field: keyof OnboardingState; value: string | string[] | number }[];
  isComplete: boolean;
  suggestedOptions?: {
    field: keyof OnboardingState;
    options: { id: string; label: string }[];
    multiSelect: boolean;
  };
}

export function isOnboardingComplete(state: OnboardingState): boolean {
  return (
    state.goals !== null &&
    state.goals.length > 0 &&
    state.limitations !== null &&
    state.limitations.length > 0 &&
    state.equipment !== null &&
    state.experienceLevel !== null &&
    state.workoutDays !== null &&
    state.workoutDays.length > 0 &&
    state.sessionLength !== null &&
    state.units !== null
  );
}

export function getEmptyOnboardingState(): OnboardingState {
  return {
    goals: null,
    limitations: null,
    equipment: null,
    experienceLevel: null,
    workoutDays: null,
    sessionLength: null,
    units: null,
  };
}
