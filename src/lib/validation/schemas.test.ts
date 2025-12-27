import { describe, it, expect } from 'vitest';
import {
  chatRequestSchema,
  generatePlanRequestSchema,
  onboardingChatRequestSchema,
  validateRequest,
} from './schemas';

describe('chatRequestSchema', () => {
  it('validates a valid chat request', () => {
    const validRequest = {
      messages: [
        { role: 'user', content: 'Hello!' },
      ],
      userContext: null,
      activePlanSchedule: null,
      exerciseLibrarySummary: null,
      exerciseLibrary: [],
    };

    const result = chatRequestSchema.safeParse(validRequest);
    expect(result.success).toBe(true);
  });

  it('rejects request without messages', () => {
    const invalidRequest = {
      userContext: null,
    };

    const result = chatRequestSchema.safeParse(invalidRequest);
    expect(result.success).toBe(false);
  });

  it('rejects request with empty messages array', () => {
    const invalidRequest = {
      messages: [],
      userContext: null,
    };

    const result = chatRequestSchema.safeParse(invalidRequest);
    expect(result.success).toBe(false);
  });

  it('rejects messages with invalid role', () => {
    const invalidRequest = {
      messages: [
        { role: 'system', content: 'Hello!' },
      ],
    };

    const result = chatRequestSchema.safeParse(invalidRequest);
    expect(result.success).toBe(false);
  });

  it('validates request with full user context', () => {
    const validRequest = {
      messages: [
        { role: 'user', content: 'Create a workout plan' },
      ],
      userContext: {
        goals: ['strength', 'flexibility'],
        limitations: ['back pain'],
        equipment: 'home',
        experienceLevel: 'beginner',
        workoutDays: ['monday', 'wednesday', 'friday'],
        sessionLength: 45,
      },
      exerciseLibrarySummary: {
        totalExercises: 50,
        muscleGroups: ['chest', 'back', 'legs'],
        equipmentTypes: ['dumbbells', 'bodyweight'],
      },
    };

    const result = chatRequestSchema.safeParse(validRequest);
    expect(result.success).toBe(true);
  });

  it('validates exercise library hash', () => {
    const validRequest = {
      messages: [{ role: 'user', content: 'Hello!' }],
      exerciseLibrary: [],
      exerciseLibraryHash: 'abc123',
    };

    const result = chatRequestSchema.safeParse(validRequest);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.exerciseLibraryHash).toBe('abc123');
    }
  });
});

describe('generatePlanRequestSchema', () => {
  it('validates a valid plan generation request', () => {
    const validRequest = {
      userProfile: {
        goals: ['build strength'],
        equipment: 'full_gym',
        experienceLevel: 'intermediate',
        workoutDays: ['monday', 'tuesday', 'thursday'],
        sessionLength: 60,
      },
    };

    const result = generatePlanRequestSchema.safeParse(validRequest);
    expect(result.success).toBe(true);
  });

  it('validates minimal user profile', () => {
    const validRequest = {
      userProfile: {},
    };

    const result = generatePlanRequestSchema.safeParse(validRequest);
    expect(result.success).toBe(true);
  });

  it('rejects invalid equipment type', () => {
    const invalidRequest = {
      userProfile: {
        equipment: 'super_gym',
      },
    };

    const result = generatePlanRequestSchema.safeParse(invalidRequest);
    expect(result.success).toBe(false);
  });

  it('rejects session length out of range', () => {
    const invalidRequest = {
      userProfile: {
        sessionLength: 200,
      },
    };

    const result = generatePlanRequestSchema.safeParse(invalidRequest);
    expect(result.success).toBe(false);
  });
});

describe('onboardingChatRequestSchema', () => {
  it('validates a valid onboarding request', () => {
    const validRequest = {
      messages: [
        { role: 'user', content: 'I want to get stronger' },
        { role: 'assistant', content: 'Great goal!' },
      ],
      collectedData: {
        goals: ['strength'],
      },
      userConfirmed: false,
    };

    const result = onboardingChatRequestSchema.safeParse(validRequest);
    expect(result.success).toBe(true);
  });

  it('defaults userConfirmed to false', () => {
    const validRequest = {
      messages: [{ role: 'user', content: 'Hello!' }],
    };

    const result = onboardingChatRequestSchema.safeParse(validRequest);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.userConfirmed).toBe(false);
    }
  });
});

describe('validateRequest', () => {
  it('returns success with parsed data for valid input', () => {
    const schema = chatRequestSchema;
    const data = {
      messages: [{ role: 'user', content: 'Hello!' }],
    };

    const result = validateRequest(schema, data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.messages).toHaveLength(1);
    }
  });

  it('returns error message for invalid input', () => {
    const schema = chatRequestSchema;
    const data = {
      messages: [],
    };

    const result = validateRequest(schema, data);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('Validation failed');
    }
  });
});
