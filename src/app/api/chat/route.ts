import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import type { DaySchedule } from '@/types/plan';
import { withAuth } from '@/lib/auth/verifyAuth';
import { getAnthropicApiKey } from '@/lib/secrets/firestoreSecrets';
import { logger } from '@/lib/logger';

// Lazy-initialized Anthropic client (fetches API key from Firestore on first use)
let anthropicClient: Anthropic | null = null;

async function getAnthropicClient(): Promise<Anthropic> {
  if (!anthropicClient) {
    const apiKey = await getAnthropicApiKey();
    anthropicClient = new Anthropic({ apiKey });
  }
  return anthropicClient;
}

const tools: Anthropic.Tool[] = [
  {
    name: 'save_workout_plan',
    description:
      "Save a complete weekly workout program as the user's new active plan. Use this when the user asks you to create a new workout program, generate a plan, or replace their current plan.",
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
                enum: [
                  'monday',
                  'tuesday',
                  'wednesday',
                  'thursday',
                  'friday',
                  'saturday',
                  'sunday',
                ],
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
  },
  {
    name: 'update_day_schedule',
    description:
      "Update a specific day's workout in the user's active plan. Use this to swap exercises, change the workout type, or mark a day as a rest day.",
    input_schema: {
      type: 'object' as const,
      properties: {
        dayOfWeek: {
          type: 'string',
          enum: [
            'monday',
            'tuesday',
            'wednesday',
            'thursday',
            'friday',
            'saturday',
            'sunday',
          ],
          description: 'The day to update',
        },
        workoutType: {
          type: 'string',
          enum: ['upper_body', 'lower_body', 'full_body', 'cardio', 'rest'],
          description: 'The type of workout',
        },
        workoutName: {
          type: 'string',
          description: 'Name of the workout (e.g., "Upper Body Strength" or "Rest Day")',
        },
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
          description: 'Updated exercises for the day (empty array for rest days)',
        },
      },
      required: ['dayOfWeek', 'workoutType', 'workoutName', 'exercises'],
    },
  },
  {
    name: 'update_exercise',
    description:
      "Update a single exercise within a day's workout. Use this for modifying sets, reps, or replacing an exercise with another.",
    input_schema: {
      type: 'object' as const,
      properties: {
        dayOfWeek: {
          type: 'string',
          enum: [
            'monday',
            'tuesday',
            'wednesday',
            'thursday',
            'friday',
            'saturday',
            'sunday',
          ],
        },
        exerciseId: {
          type: 'string',
          description: 'ID of the exercise to update',
        },
        updates: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            sets: { type: 'number' },
            reps: { type: 'number' },
            notes: { type: 'string' },
          },
          description: 'Fields to update on the exercise',
        },
      },
      required: ['dayOfWeek', 'exerciseId', 'updates'],
    },
  },
  // Exercise Library Tools
  {
    name: 'query_exercise_library',
    description:
      "Search the user's exercise library to find exercises matching criteria. Use this when creating workout plans to prefer exercises the user already knows, or when the user asks about exercises for specific muscle groups or equipment.",
    input_schema: {
      type: 'object' as const,
      properties: {
        muscleGroup: {
          type: 'string',
          enum: [
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
          ],
          description: 'Filter by primary or secondary muscle group',
        },
        equipment: {
          type: 'string',
          enum: [
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
          ],
          description: 'Filter by equipment required',
        },
        difficulty: {
          type: 'string',
          enum: ['beginner', 'intermediate', 'advanced'],
          description: 'Filter by difficulty level',
        },
        searchTerm: {
          type: 'string',
          description: 'Search by exercise name',
        },
      },
      required: [],
    },
  },
  {
    name: 'add_exercise_to_library',
    description:
      "Add a new exercise to the user's exercise library. Use this when suggesting a new exercise that isn't in their library yet, or when the user asks to save an exercise.",
    input_schema: {
      type: 'object' as const,
      properties: {
        name: {
          type: 'string',
          description: 'Name of the exercise',
        },
        primaryMuscles: {
          type: 'array',
          items: {
            type: 'string',
            enum: [
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
            ],
          },
          description: 'Primary muscle groups worked',
        },
        secondaryMuscles: {
          type: 'array',
          items: {
            type: 'string',
            enum: [
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
            ],
          },
          description: 'Secondary muscle groups worked (optional)',
        },
        equipmentRequired: {
          type: 'array',
          items: {
            type: 'string',
            enum: [
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
            ],
          },
          description: 'Equipment needed for the exercise',
        },
        difficulty: {
          type: 'string',
          enum: ['beginner', 'intermediate', 'advanced'],
          description: 'Difficulty level',
        },
        instructions: {
          type: 'array',
          items: { type: 'string' },
          description: 'Step-by-step instructions for performing the exercise',
        },
        tips: {
          type: 'array',
          items: { type: 'string' },
          description: 'Safety tips especially for older adults (optional)',
        },
      },
      required: ['name', 'primaryMuscles', 'equipmentRequired', 'difficulty', 'instructions'],
    },
  },
  {
    name: 'get_exercise_details',
    description:
      "Get full details about a specific exercise from the user's library, including instructions and tips. Use this when the user asks about how to perform an exercise.",
    input_schema: {
      type: 'object' as const,
      properties: {
        exerciseName: {
          type: 'string',
          description: 'The name of the exercise to look up',
        },
      },
      required: ['exerciseName'],
    },
  },
];

interface ToolAction {
  tool: string;
  data: unknown;
}

interface ExerciseLibrarySummary {
  totalExercises: number;
  muscleGroups: string[];
  equipmentTypes: string[];
}

// Exercise data passed from client for server-side queries
interface ExerciseData {
  id: string;
  name: string;
  primaryMuscles: string[];
  secondaryMuscles?: string[];
  equipmentRequired: string[];
  difficulty: string;
  instructions: string[];
  tips?: string[];
}

// Query tools that need to be executed server-side
const QUERY_TOOLS = ['query_exercise_library', 'get_exercise_details'];

// Execute query tools server-side and return results
function executeQueryTool(
  toolName: string,
  input: Record<string, unknown>,
  exerciseLibrary: ExerciseData[]
): string {
  switch (toolName) {
    case 'query_exercise_library': {
      const { muscleGroup, equipment, difficulty, searchTerm } = input as {
        muscleGroup?: string;
        equipment?: string;
        difficulty?: string;
        searchTerm?: string;
      };

      let results = [...exerciseLibrary];

      if (muscleGroup) {
        results = results.filter(
          (ex) =>
            ex.primaryMuscles.includes(muscleGroup) ||
            ex.secondaryMuscles?.includes(muscleGroup)
        );
      }

      if (equipment) {
        results = results.filter((ex) =>
          ex.equipmentRequired.includes(equipment)
        );
      }

      if (difficulty) {
        results = results.filter((ex) => ex.difficulty === difficulty);
      }

      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        results = results.filter((ex) =>
          ex.name.toLowerCase().includes(term)
        );
      }

      if (results.length === 0) {
        return 'No exercises found matching the criteria.';
      }

      // Return summarized results (limit to 10 to avoid token bloat)
      const displayResults = results.slice(0, 10);
      const resultSummary = displayResults
        .map(
          (ex) =>
            `- ${ex.name} (${ex.difficulty}, muscles: ${ex.primaryMuscles.join(', ')}, equipment: ${ex.equipmentRequired.join(', ')})`
        )
        .join('\n');

      return `Found ${results.length} exercises${results.length > 10 ? ' (showing first 10)' : ''}:\n${resultSummary}`;
    }

    case 'get_exercise_details': {
      const { exerciseName } = input as { exerciseName: string };
      const lowerName = exerciseName.toLowerCase();

      // Try exact match first
      let exercise = exerciseLibrary.find(
        (ex) => ex.name.toLowerCase() === lowerName
      );

      // Fall back to partial match
      if (!exercise) {
        exercise = exerciseLibrary.find((ex) =>
          ex.name.toLowerCase().includes(lowerName)
        );
      }

      if (!exercise) {
        return `Exercise "${exerciseName}" not found in the user's library.`;
      }

      const details = [
        `**${exercise.name}**`,
        `Difficulty: ${exercise.difficulty}`,
        `Primary muscles: ${exercise.primaryMuscles.join(', ')}`,
        exercise.secondaryMuscles?.length
          ? `Secondary muscles: ${exercise.secondaryMuscles.join(', ')}`
          : null,
        `Equipment: ${exercise.equipmentRequired.join(', ')}`,
        '',
        '**Instructions:**',
        ...exercise.instructions.map((inst, i) => `${i + 1}. ${inst}`),
        exercise.tips?.length
          ? `\n**Tips:**\n${exercise.tips.map((tip) => `- ${tip}`).join('\n')}`
          : null,
      ]
        .filter(Boolean)
        .join('\n');

      return details;
    }

    default:
      return 'Unknown query tool';
  }
}

function buildSystemPrompt(
  userContext: {
    goals?: string[];
    limitations?: string[];
    equipment?: string;
    experienceLevel?: string;
    workoutDays?: string[];
    sessionLength?: number;
  } | null,
  activePlan: DaySchedule[] | null,
  exerciseLibrary?: ExerciseLibrarySummary | null
): string {
  const planContext = activePlan
    ? `Current Active Plan:\n${JSON.stringify(activePlan, null, 2)}`
    : 'No active plan - user needs a workout program created.';

  const exerciseLibraryContext = exerciseLibrary
    ? `Exercise Library: User has ${exerciseLibrary.totalExercises} exercises available.
   - Muscle groups covered: ${exerciseLibrary.muscleGroups.join(', ')}
   - Equipment types: ${exerciseLibrary.equipmentTypes.join(', ')}`
    : 'Exercise Library: Not yet initialized.';

  return `You are an AI personal trainer assistant designed for users aged 60+. Your role is to:

1. Provide helpful, encouraging fitness advice tailored to older adults
2. Answer questions about exercises, modifications, and workout plans
3. Suggest exercise alternatives when users report pain or limitations
4. Create and modify workout programs using the available tools
5. Be supportive and understanding of physical limitations

User Context:
- Goals: ${userContext?.goals?.join(', ') || 'Not specified'}
- Limitations: ${userContext?.limitations?.join(', ') || 'None specified'}
- Equipment: ${userContext?.equipment || 'Not specified'}
- Experience Level: ${userContext?.experienceLevel || 'Not specified'}
- Preferred Workout Days: ${userContext?.workoutDays?.join(', ') || 'Not specified'}
- Session Length: ${userContext?.sessionLength || 45} minutes

${planContext}

${exerciseLibraryContext}

## Available Tools

You have access to workout management tools that save directly to the user's account:

### Workout Plan Tools

1. **save_workout_plan**: Create a complete new weekly workout program
   - Use when the user asks for a new program, to "create my plan", or wants to start fresh
   - Must include all 7 days of the week
   - Include 4-6 exercises per workout day (appropriate for their experience level)
   - Rest days should have workoutType: "rest" and empty exercises array
   - Generate unique IDs for each exercise (e.g., "ex-1", "ex-2", etc.)
   - PREFER exercises from the user's library when possible

2. **update_day_schedule**: Modify a specific day's workout
   - Use to swap exercises, change workout type, or mark as rest day
   - Changes are saved immediately to the user's account

3. **update_exercise**: Update a single exercise
   - Use for fine-grained changes (sets, reps, notes, or replacing an exercise)
   - Use the exercise's existing ID when updating

### Exercise Library Tools

4. **query_exercise_library**: Search the user's exercise library
   - Use BEFORE creating workout plans to find exercises they already know
   - Filter by muscle group, equipment, difficulty, or search by name
   - Returns matching exercises from their personal library

5. **add_exercise_to_library**: Add a new exercise to the library
   - Use when suggesting an exercise that isn't in their library
   - Include full details: name, muscles, equipment, difficulty, instructions, tips
   - The exercise will be saved to their library for future use

6. **get_exercise_details**: Look up an exercise's full details
   - Use when the user asks how to perform an exercise
   - Returns instructions and safety tips

## Guidelines

- Keep responses concise and easy to read
- Use simple, clear language (avoid jargon)
- Prioritize safety - always recommend consulting a doctor for pain/injuries
- Be encouraging but realistic
- Suggest modifications when appropriate
- Remember that recovery is important for this age group
- IMPORTANT: When creating or modifying plans, ALWAYS use the tools to save - don't just describe the plan
- After using a tool, confirm the action to the user (e.g., "I've saved your new workout plan!" or "I've updated Monday's workout.")
- For exercises, PREFER ones from the user's library. Use query_exercise_library first to find suitable exercises.
- If suggesting a new exercise not in their library, offer to add it using add_exercise_to_library
- When the user asks about exercise form or how to do an exercise, use get_exercise_details to look it up`;
}

async function handleChatRequest(
  request: NextRequest,
  { userId }: { userId: string }
) {
  try {
    const {
      messages,
      userContext,
      activePlanSchedule,
      exerciseLibrarySummary,
      exerciseLibrary = [] // Full exercise library for query tools
    } = await request.json();

    // Log authenticated request (userId is now verified)
    logger.log('Chat request from user:', userId);

    const systemPrompt = buildSystemPrompt(
      userContext,
      activePlanSchedule || null,
      exerciseLibrarySummary || null
    );

    const anthropic = await getAnthropicClient();
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: systemPrompt,
      tools,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    });

    let assistantMessage = '';
    const toolActions: ToolAction[] = [];

    for (const block of response.content) {
      if (block.type === 'text') {
        assistantMessage += block.text;
      } else if (block.type === 'tool_use') {
        toolActions.push({
          tool: block.name,
          data: block.input,
        });
      }
    }

    // If tools were called but no text response, continue conversation
    if (!assistantMessage && response.stop_reason === 'tool_use') {
      // Build tool results - execute query tools server-side, mark others as needing client execution
      const toolResultBlocks: Anthropic.ToolResultBlockParam[] = response.content
        .filter((block): block is Anthropic.ToolUseBlock => block.type === 'tool_use')
        .map((block) => {
          // Execute query tools server-side with real results
          if (QUERY_TOOLS.includes(block.name)) {
            const result = executeQueryTool(
              block.name,
              block.input as Record<string, unknown>,
              exerciseLibrary as ExerciseData[]
            );
            return {
              type: 'tool_result' as const,
              tool_use_id: block.id,
              content: result,
            };
          }

          // Write tools will be executed client-side
          return {
            type: 'tool_result' as const,
            tool_use_id: block.id,
            content: 'Saved successfully',
          };
        });

      const continuedResponse = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        system: systemPrompt,
        tools,
        messages: [
          ...messages.map((m: { role: string; content: string }) => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
          })),
          {
            role: 'assistant' as const,
            content: response.content,
          },
          {
            role: 'user' as const,
            content: toolResultBlocks,
          },
        ],
      });

      for (const block of continuedResponse.content) {
        if (block.type === 'text') {
          assistantMessage += block.text;
        }
      }
    }

    return NextResponse.json({
      message: assistantMessage || "I've updated your workout plan!",
      toolActions,
    });
  } catch (error) {
    logger.error('Chat API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to get response from AI', details: errorMessage },
      { status: 500 }
    );
  }
}

// Export POST handler wrapped with authentication
export const POST = withAuth(handleChatRequest);
