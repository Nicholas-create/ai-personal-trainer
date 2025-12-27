import { z } from 'zod';

// ============================================
// Shared Schema Components
// ============================================

const muscleGroupSchema = z.enum([
  'chest',
  'back',
  'shoulders',
  'biceps',
  'triceps',
  'core',
  'quadriceps',
  'hamstrings',
  'glutes',
  'calves',
  'forearms',
  'full_body',
]);

const equipmentTypeSchema = z.enum([
  'none',
  'dumbbells',
  'barbell',
  'kettlebell',
  'resistance_bands',
  'cable_machine',
  'bench',
  'pull_up_bar',
  'machine',
  'medicine_ball',
  'stability_ball',
]);

const difficultyLevelSchema = z.enum(['beginner', 'intermediate', 'advanced']);

const workoutTypeSchema = z.enum([
  'upper_body',
  'lower_body',
  'full_body',
  'cardio',
  'rest',
]);

const dayOfWeekSchema = z.enum([
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
]);

// ============================================
// Chat API Schemas
// ============================================

// Message content limits for security and cost control
const MAX_MESSAGE_LENGTH = 10000; // 10KB per message
const MAX_MESSAGES = 100; // Maximum messages in conversation

const messageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1).max(MAX_MESSAGE_LENGTH),
});

const userContextSchema = z
  .object({
    goals: z.array(z.string()).optional(),
    limitations: z.array(z.string()).optional(),
    equipment: z.enum(['full_gym', 'home', 'minimal']).optional(),
    experienceLevel: difficultyLevelSchema.optional(),
    workoutDays: z.array(z.string()).optional(),
    sessionLength: z.number().min(15).max(120).optional(),
  })
  .nullable()
  .optional();

const planExerciseSchema = z.object({
  id: z.string(),
  name: z.string(),
  sets: z.number().int().min(1).max(20),
  reps: z.number().int().min(1).max(100),
  notes: z.string().optional(),
});

const dayScheduleSchema = z.object({
  dayOfWeek: z.string(),
  workoutType: workoutTypeSchema,
  workoutName: z.string(),
  exercises: z.array(planExerciseSchema),
});

const exerciseLibrarySummarySchema = z
  .object({
    totalExercises: z.number().int().min(0),
    muscleGroups: z.array(z.string()),
    equipmentTypes: z.array(z.string()),
  })
  .nullable()
  .optional();

const exerciseDataSchema = z.object({
  id: z.string(),
  name: z.string(),
  primaryMuscles: z.array(z.string()),
  secondaryMuscles: z.array(z.string()).optional(),
  equipmentRequired: z.array(z.string()),
  difficulty: z.string(),
  instructions: z.array(z.string()),
  tips: z.array(z.string()).optional(),
});

// Maximum total content size for all messages combined (500KB)
const MAX_TOTAL_CONTENT_SIZE = 500000;

export const chatRequestSchema = z.object({
  messages: z.array(messageSchema).min(1).max(MAX_MESSAGES),
  userContext: userContextSchema,
  activePlanSchedule: z.array(dayScheduleSchema).nullable().optional(),
  exerciseLibrarySummary: exerciseLibrarySummarySchema,
  exerciseLibrary: z.array(exerciseDataSchema).default([]),
  // Optional cache hash - if matches server cache, exercise library can be omitted
  exerciseLibraryHash: z.string().optional(),
}).refine(
  (data) => {
    const totalContentSize = data.messages.reduce(
      (sum, msg) => sum + msg.content.length,
      0
    );
    return totalContentSize <= MAX_TOTAL_CONTENT_SIZE;
  },
  {
    message: `Total message content exceeds ${MAX_TOTAL_CONTENT_SIZE / 1000}KB limit`,
    path: ['messages'],
  }
);

export type ChatRequest = z.infer<typeof chatRequestSchema>;

// ============================================
// Generate Plan API Schemas
// ============================================

const userProfileSchema = z.object({
  goals: z.array(z.string()).optional(),
  limitations: z.array(z.string()).optional(),
  equipment: z.enum(['full_gym', 'home', 'minimal']).optional(),
  experienceLevel: difficultyLevelSchema.optional(),
  workoutDays: z.array(z.string()).optional(),
  sessionLength: z.number().min(15).max(120).optional(),
  units: z.enum(['lbs', 'kg']).optional(),
});

export const generatePlanRequestSchema = z.object({
  userProfile: userProfileSchema,
});

export type GeneratePlanRequest = z.infer<typeof generatePlanRequestSchema>;

// ============================================
// Onboarding Chat API Schemas
// ============================================

const onboardingStateSchema = z.object({
  goals: z.array(z.string()).optional(),
  limitations: z.array(z.string()).optional(),
  equipment: z.string().optional(),
  experienceLevel: z.string().optional(),
  workoutDays: z.array(z.string()).optional(),
  sessionLength: z.number().optional(),
  units: z.string().optional(),
});

export const onboardingChatRequestSchema = z.object({
  messages: z.array(messageSchema).min(1).max(MAX_MESSAGES),
  collectedData: onboardingStateSchema.optional(),
  userConfirmed: z.boolean().default(false),
});

export type OnboardingChatRequest = z.infer<typeof onboardingChatRequestSchema>;

// ============================================
// Validation Helper
// ============================================

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Validate request body against a Zod schema
 * Returns a typed result object with parsed data or error message
 */
export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  const result = schema.safeParse(data);

  if (!result.success) {
    const errors = result.error.issues
      .map((e) => `${e.path.join('.')}: ${e.message}`)
      .join(', ');
    return {
      success: false,
      error: `Validation failed: ${errors}`,
    };
  }

  return {
    success: true,
    data: result.data,
  };
}
