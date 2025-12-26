// Shared type literals for consistency
export type EquipmentLevel = 'full_gym' | 'home' | 'minimal';
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';
export type WeightUnit = 'lbs' | 'kg';

export interface UserProfile {
  goals: string[];
  limitations: string[];
  equipment: EquipmentLevel;
  experienceLevel: ExperienceLevel;
  workoutDays: string[];
  sessionLength: number;
  units: WeightUnit;
}

export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: Date;
  onboardingComplete: boolean;
  profile?: UserProfile;
}

// OnboardingData uses the same strict types as UserProfile for consistency
export interface OnboardingData {
  goals: string[];
  limitations: string[];
  equipment: EquipmentLevel;
  experienceLevel: ExperienceLevel;
  workoutDays: string[];
  sessionLength: number;
  units: WeightUnit;
}

// Helper to create empty onboarding data with defaults
export function createEmptyOnboardingData(): OnboardingData {
  return {
    goals: [],
    limitations: [],
    equipment: 'home',
    experienceLevel: 'beginner',
    workoutDays: [],
    sessionLength: 30,
    units: 'lbs',
  };
}

// Type guard to validate onboarding data
export function isValidOnboardingData(data: Partial<OnboardingData>): data is OnboardingData {
  const validEquipment: EquipmentLevel[] = ['full_gym', 'home', 'minimal'];
  const validExperience: ExperienceLevel[] = ['beginner', 'intermediate', 'advanced'];
  const validUnits: WeightUnit[] = ['lbs', 'kg'];

  return (
    Array.isArray(data.goals) &&
    Array.isArray(data.limitations) &&
    validEquipment.includes(data.equipment as EquipmentLevel) &&
    validExperience.includes(data.experienceLevel as ExperienceLevel) &&
    Array.isArray(data.workoutDays) &&
    typeof data.sessionLength === 'number' &&
    validUnits.includes(data.units as WeightUnit)
  );
}
