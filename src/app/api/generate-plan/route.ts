import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { withAuth } from '@/lib/auth/verifyAuth';
import { getAnthropicClient, MODEL_CONFIG } from '@/lib/ai/anthropicClient';
import { logger } from '@/lib/logger';
import { generatePlanRequestSchema, validateRequest } from '@/lib/validation/schemas';
import { applyRateLimit, getRateLimitHeaders } from '@/lib/rateLimit';

// Tool definition for structured workout plan output
const generatePlanTool: Anthropic.Tool = {
  name: 'save_workout_plan',
  description: 'Save the generated weekly workout plan. You MUST call this tool with the complete 7-day workout schedule.',
  input_schema: {
    type: 'object' as const,
    properties: {
      workoutSchedule: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            dayOfWeek: {
              type: 'string',
              enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
            },
            workoutType: {
              type: 'string',
              enum: ['upper_body', 'lower_body', 'full_body', 'cardio', 'rest'],
            },
            workoutName: { type: 'string' },
            exercises: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  sets: { type: 'number' },
                  reps: { type: 'number' },
                  notes: { type: 'string' },
                },
                required: ['id', 'name', 'sets', 'reps'],
              },
            },
          },
          required: ['dayOfWeek', 'workoutType', 'workoutName', 'exercises'],
        },
        description: 'Array of 7 DaySchedule objects, one for each day of the week',
      },
    },
    required: ['workoutSchedule'],
  },
};

async function handleGeneratePlan(
  request: NextRequest,
  { userId }: { userId: string }
) {
  // Apply rate limiting (stricter for plan generation, now async with Firestore)
  const rateLimitResult = await applyRateLimit(userId, 'generatePlan');
  if (rateLimitResult) {
    return rateLimitResult;
  }

  try {
    // Parse and validate request body
    const rawBody = await request.json();
    const validation = validateRequest(generatePlanRequestSchema, rawBody);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const { userProfile } = validation.data;

    logger.log('Generate plan request from user:', userId);

    const systemPrompt = `You are an AI personal trainer creating a weekly workout plan for users aged 60+.

User Profile:
- Goals: ${userProfile.goals?.join(', ') || 'General fitness'}
- Limitations: ${userProfile.limitations?.join(', ') || 'None'}
- Equipment: ${userProfile.equipment || 'full_gym'}
- Experience Level: ${userProfile.experienceLevel || 'intermediate'}
- Preferred Workout Days: ${userProfile.workoutDays?.join(', ') || 'Monday, Wednesday, Friday'}
- Session Length: ${userProfile.sessionLength || 45} minutes

Guidelines:
1. Include all 7 days (monday through sunday)
2. Add rest days where appropriate (usually 2-3 per week)
3. For rest days, use workoutType: "rest" and empty exercises array
4. Consider user limitations when selecting exercises
5. Include 4-6 exercises per workout day
6. Vary workout types: upper_body, lower_body, full_body, cardio, rest
7. Include warm-up exercises
8. Keep exercises appropriate for 60+ users (safe, effective)
9. Generate unique IDs for exercises (e.g., "ex-mon-1", "ex-tue-1")

You MUST use the save_workout_plan tool to submit the complete workout plan.`;

    const anthropic = await getAnthropicClient();
    const response = await anthropic.messages.create({
      model: MODEL_CONFIG.planGeneration.model,
      max_tokens: MODEL_CONFIG.planGeneration.maxTokens,
      system: systemPrompt,
      tools: [generatePlanTool],
      tool_choice: { type: 'tool', name: 'save_workout_plan' },
      messages: [
        {
          role: 'user',
          content: 'Please generate a weekly workout plan for me based on my profile.',
        },
      ],
    });

    // Extract the structured data from tool use
    const toolUseBlock = response.content.find(
      (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
    );

    if (!toolUseBlock || toolUseBlock.name !== 'save_workout_plan') {
      logger.error('No tool use found in response:', response.content);
      return NextResponse.json(
        { error: 'Failed to generate workout plan - no structured output' },
        { status: 500 }
      );
    }

    // The input is already structured JSON from the tool call
    const workoutPlan = toolUseBlock.input as { workoutSchedule: unknown[] };

    // Validate we got a complete plan
    if (!workoutPlan.workoutSchedule || workoutPlan.workoutSchedule.length !== 7) {
      logger.error('Incomplete workout plan:', workoutPlan);
      return NextResponse.json(
        { error: 'Generated plan is incomplete - expected 7 days' },
        { status: 500 }
      );
    }

    const jsonResponse = NextResponse.json(workoutPlan);

    // Add rate limit headers (now async with Firestore)
    const rateLimitHeaders = await getRateLimitHeaders(userId, 'generatePlan');
    Object.entries(rateLimitHeaders).forEach(([key, value]) => {
      jsonResponse.headers.set(key, value);
    });

    return jsonResponse;
  } catch (error) {
    logger.error('Generate plan API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate workout plan' },
      { status: 500 }
    );
  }
}

// Export POST handler wrapped with authentication
export const POST = withAuth(handleGeneratePlan);
