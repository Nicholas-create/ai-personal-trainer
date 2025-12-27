import { describe, it, expect } from 'vitest';
import {
  isValidOnboardingData,
  createEmptyOnboardingData,
  type OnboardingData,
  type EquipmentLevel,
  type ExperienceLevel,
  type WeightUnit,
} from './user';

describe('isValidOnboardingData', () => {
  it('returns true for valid onboarding data', () => {
    const validData: OnboardingData = {
      goals: ['strength', 'flexibility'],
      limitations: ['back pain'],
      equipment: 'home',
      experienceLevel: 'beginner',
      workoutDays: ['monday', 'wednesday', 'friday'],
      sessionLength: 45,
      units: 'lbs',
    };

    expect(isValidOnboardingData(validData)).toBe(true);
  });

  it('returns true for minimal valid data', () => {
    const validData: OnboardingData = {
      goals: [],
      limitations: [],
      equipment: 'minimal',
      experienceLevel: 'intermediate',
      workoutDays: [],
      sessionLength: 30,
      units: 'kg',
    };

    expect(isValidOnboardingData(validData)).toBe(true);
  });

  it('returns false for missing goals array', () => {
    const invalidData = {
      limitations: [],
      equipment: 'home',
      experienceLevel: 'beginner',
      workoutDays: [],
      sessionLength: 30,
      units: 'lbs',
    } as Partial<OnboardingData>;

    expect(isValidOnboardingData(invalidData)).toBe(false);
  });

  it('returns false for invalid equipment type', () => {
    const invalidData = {
      goals: [],
      limitations: [],
      equipment: 'super_gym' as EquipmentLevel,
      experienceLevel: 'beginner',
      workoutDays: [],
      sessionLength: 30,
      units: 'lbs',
    };

    expect(isValidOnboardingData(invalidData)).toBe(false);
  });

  it('returns false for invalid experience level', () => {
    const invalidData = {
      goals: [],
      limitations: [],
      equipment: 'home',
      experienceLevel: 'expert' as ExperienceLevel,
      workoutDays: [],
      sessionLength: 30,
      units: 'lbs',
    };

    expect(isValidOnboardingData(invalidData)).toBe(false);
  });

  it('returns false for invalid units', () => {
    const invalidData = {
      goals: [],
      limitations: [],
      equipment: 'home',
      experienceLevel: 'beginner',
      workoutDays: [],
      sessionLength: 30,
      units: 'stones' as WeightUnit,
    };

    expect(isValidOnboardingData(invalidData)).toBe(false);
  });

  it('returns false for non-array goals', () => {
    const invalidData = {
      goals: 'strength',
      limitations: [],
      equipment: 'home',
      experienceLevel: 'beginner',
      workoutDays: [],
      sessionLength: 30,
      units: 'lbs',
    } as unknown as Partial<OnboardingData>;

    expect(isValidOnboardingData(invalidData)).toBe(false);
  });

  it('returns false for non-number session length', () => {
    const invalidData = {
      goals: [],
      limitations: [],
      equipment: 'home',
      experienceLevel: 'beginner',
      workoutDays: [],
      sessionLength: '30 minutes',
      units: 'lbs',
    } as unknown as Partial<OnboardingData>;

    expect(isValidOnboardingData(invalidData)).toBe(false);
  });
});

describe('createEmptyOnboardingData', () => {
  it('creates valid empty onboarding data', () => {
    const emptyData = createEmptyOnboardingData();

    expect(isValidOnboardingData(emptyData)).toBe(true);
  });

  it('has expected default values', () => {
    const emptyData = createEmptyOnboardingData();

    expect(emptyData.goals).toEqual([]);
    expect(emptyData.limitations).toEqual([]);
    expect(emptyData.equipment).toBe('home');
    expect(emptyData.experienceLevel).toBe('beginner');
    expect(emptyData.workoutDays).toEqual([]);
    expect(emptyData.sessionLength).toBe(30);
    expect(emptyData.units).toBe('lbs');
  });

  it('creates a new object each time', () => {
    const data1 = createEmptyOnboardingData();
    const data2 = createEmptyOnboardingData();

    expect(data1).not.toBe(data2);
    expect(data1.goals).not.toBe(data2.goals);
  });
});
