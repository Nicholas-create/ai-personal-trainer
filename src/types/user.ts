export interface UserProfile {
  goals: string[];
  limitations: string[];
  equipment: 'full_gym' | 'home' | 'minimal';
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  workoutDays: string[];
  sessionLength: number;
  units: 'lbs' | 'kg';
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

export interface OnboardingData {
  goals: string[];
  limitations: string[];
  equipment: string;
  experienceLevel: string;
  workoutDays: string[];
  sessionLength: number;
  units: string;
}
