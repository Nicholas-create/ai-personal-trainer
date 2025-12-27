import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import {
  OnboardingState,
  OnboardingChatResponse,
  GOAL_OPTIONS,
  LIMITATION_OPTIONS,
  EQUIPMENT_OPTIONS,
  EXPERIENCE_OPTIONS,
  DAY_OPTIONS,
  SESSION_LENGTH_OPTIONS,
  UNIT_OPTIONS,
  VALID_GOALS,
  VALID_LIMITATIONS,
  VALID_EQUIPMENT,
  VALID_EXPERIENCE,
  VALID_DAYS,
  VALID_SESSION_LENGTHS,
  VALID_UNITS,
} from '@/types/onboarding';
import { withAuth } from '@/lib/auth/verifyAuth';
import { getAnthropicClient, MODEL_CONFIG } from '@/lib/ai/anthropicClient';
import { logger } from '@/lib/logger';
import { onboardingChatRequestSchema, validateRequest } from '@/lib/validation/schemas';
import { applyRateLimit, getRateLimitHeaders } from '@/lib/rateLimit';

function formatCollectedData(data: OnboardingState): string {
  const fields = [];
  if (data.goals?.length) fields.push(`- Goals: ${data.goals.join(', ')}`);
  if (data.limitations?.length) fields.push(`- Limitations: ${data.limitations.join(', ')}`);
  if (data.equipment) fields.push(`- Equipment: ${data.equipment}`);
  if (data.experienceLevel) fields.push(`- Experience: ${data.experienceLevel}`);
  if (data.workoutDays?.length) fields.push(`- Workout Days: ${data.workoutDays.join(', ')}`);
  if (data.sessionLength) fields.push(`- Session Length: ${data.sessionLength} minutes`);
  if (data.units) fields.push(`- Units: ${data.units}`);
  return fields.length ? fields.join('\n') : 'None collected yet';
}

function getRemainingFields(data: OnboardingState): string[] {
  const remaining = [];
  if (!data.goals?.length) remaining.push('goals');
  if (!data.limitations?.length) remaining.push('limitations');
  if (!data.equipment) remaining.push('equipment');
  if (!data.experienceLevel) remaining.push('experienceLevel');
  if (!data.workoutDays?.length) remaining.push('workoutDays');
  if (!data.sessionLength) remaining.push('sessionLength');
  if (!data.units) remaining.push('units');
  return remaining;
}

function buildSystemPrompt(collectedData: OnboardingState, userConfirmed: boolean): string {
  const remaining = getRemainingFields(collectedData);
  const allCollected = remaining.length === 0;

  return `You are a friendly AI personal trainer helping a new user set up their fitness profile. Your goal is to have a natural, warm conversation while collecting information about their fitness preferences.

## Information to Collect

You need to collect these 7 pieces of information:

1. **Goals** (can select multiple):
${GOAL_OPTIONS.map(g => `   - ${g.id}: ${g.label}`).join('\n')}

2. **Physical Limitations** (can select multiple, or "none"):
${LIMITATION_OPTIONS.map(l => `   - ${l.id}: ${l.label}`).join('\n')}

3. **Equipment Access** (select one):
${EQUIPMENT_OPTIONS.map(e => `   - ${e.id}: ${e.label} - ${e.description}`).join('\n')}

4. **Experience Level** (select one):
${EXPERIENCE_OPTIONS.map(e => `   - ${e.id}: ${e.label} - ${e.description}`).join('\n')}

5. **Workout Days** (select multiple):
${DAY_OPTIONS.map(d => `   - ${d.id}: ${d.label}`).join('\n')}

6. **Session Length** (select one):
${SESSION_LENGTH_OPTIONS.map(s => `   - ${s.id}: ${s.label}`).join('\n')}

7. **Weight Units** (select one):
${UNIT_OPTIONS.map(u => `   - ${u.id}: ${u.label}`).join('\n')}

## Current Progress

**Collected Data:**
${formatCollectedData(collectedData)}

**Remaining Fields:** ${remaining.length ? remaining.join(', ') : 'ALL COMPLETE'}

${userConfirmed ? '**User has confirmed their choices.**' : ''}

## Conversation Guidelines

1. Be warm, encouraging, and conversational - NOT like a form
2. Ask about 1-2 related topics at a time, not all at once
3. When the user responds, use the save_onboarding_field tool to extract their choices
4. Acknowledge their choices naturally before moving on
5. If their response is unclear, ask a clarifying follow-up
6. Handle corrections gracefully - users can change previous answers
7. Use the suggest_options tool to show clickable buttons for the current question

## Flow Suggestions

- Start by asking about goals
- Then ask about limitations
- Then equipment and experience together
- Then workout days and session length together
- Finally, ask about units preference
- Once all fields are collected, summarize everything and ask for confirmation

${allCollected && !userConfirmed ? `
## ALL DATA COLLECTED - AWAITING CONFIRMATION

All fields have been collected! You should now:
1. Provide a friendly summary of all their choices
2. Ask them to confirm these are correct
3. Let them know they can make changes if needed

When they confirm (say something like "looks good", "yes", "confirm", etc.), use the confirm_onboarding tool.
` : ''}

${allCollected && userConfirmed ? `
## ONBOARDING COMPLETE

The user has confirmed their choices. Thank them and let them know they're all set!
` : ''}

## Important Notes

- Map natural language to valid option IDs (e.g., "I want to get stronger" -> goals: ["strength"])
- For workout days, understand casual mentions like "weekdays" = monday-friday, "MWF" = monday, wednesday, friday
- You can call multiple tools in one response if the user provides multiple pieces of information
- Always use valid option IDs when calling save_onboarding_field`;
}

const tools: Anthropic.Tool[] = [
  {
    name: 'save_onboarding_field',
    description: 'Save a piece of onboarding data extracted from the user\'s response. Call this whenever you identify valid data from what the user said.',
    input_schema: {
      type: 'object' as const,
      properties: {
        field: {
          type: 'string',
          enum: ['goals', 'limitations', 'equipment', 'experienceLevel', 'workoutDays', 'sessionLength', 'units'],
          description: 'The onboarding field being saved',
        },
        value: {
          oneOf: [
            { type: 'string' },
            { type: 'array', items: { type: 'string' } },
            { type: 'number' },
          ],
          description: 'The extracted value. Use array for goals, limitations, workoutDays. Use string for equipment, experienceLevel, units. Use number for sessionLength.',
        },
      },
      required: ['field', 'value'],
    },
  },
  {
    name: 'suggest_options',
    description: 'Suggest clickable option buttons to show the user for the current question. Use this to make selection easier.',
    input_schema: {
      type: 'object' as const,
      properties: {
        field: {
          type: 'string',
          enum: ['goals', 'limitations', 'equipment', 'experienceLevel', 'workoutDays', 'sessionLength', 'units'],
          description: 'The field these options are for',
        },
        multiSelect: {
          type: 'boolean',
          description: 'Whether the user can select multiple options (true for goals, limitations, workoutDays)',
        },
      },
      required: ['field', 'multiSelect'],
    },
  },
  {
    name: 'confirm_onboarding',
    description: 'Call this when all fields are collected AND the user has confirmed their choices are correct.',
    input_schema: {
      type: 'object' as const,
      properties: {
        confirmed: {
          type: 'boolean',
          description: 'Always true when calling this tool',
        },
      },
      required: ['confirmed'],
    },
  },
];

function validateAndNormalizeValue(
  field: keyof OnboardingState,
  value: unknown
): string | string[] | number | null {
  switch (field) {
    case 'goals': {
      const arr = Array.isArray(value) ? value : [value];
      const valid = arr.filter((v): v is string => typeof v === 'string' && VALID_GOALS.includes(v));
      return valid.length ? valid : null;
    }
    case 'limitations': {
      const arr = Array.isArray(value) ? value : [value];
      const valid = arr.filter((v): v is string => typeof v === 'string' && VALID_LIMITATIONS.includes(v));
      return valid.length ? valid : null;
    }
    case 'equipment': {
      const str = String(value);
      return VALID_EQUIPMENT.includes(str) ? str : null;
    }
    case 'experienceLevel': {
      const str = String(value);
      return VALID_EXPERIENCE.includes(str) ? str : null;
    }
    case 'workoutDays': {
      const arr = Array.isArray(value) ? value : [value];
      const valid = arr.filter((v): v is string => typeof v === 'string' && VALID_DAYS.includes(v));
      return valid.length ? valid : null;
    }
    case 'sessionLength': {
      const num = typeof value === 'number' ? value : parseInt(String(value), 10);
      return VALID_SESSION_LENGTHS.includes(num as 30 | 45 | 60) ? num : null;
    }
    case 'units': {
      const str = String(value);
      return VALID_UNITS.includes(str) ? str : null;
    }
    default:
      return null;
  }
}

function getOptionsForField(field: keyof OnboardingState): { id: string; label: string }[] {
  switch (field) {
    case 'goals':
      return GOAL_OPTIONS.map(o => ({ id: o.id, label: o.label }));
    case 'limitations':
      return LIMITATION_OPTIONS.map(o => ({ id: o.id, label: o.label }));
    case 'equipment':
      return EQUIPMENT_OPTIONS.map(o => ({ id: o.id, label: o.label }));
    case 'experienceLevel':
      return EXPERIENCE_OPTIONS.map(o => ({ id: o.id, label: o.label }));
    case 'workoutDays':
      return DAY_OPTIONS.map(o => ({ id: o.id, label: o.label }));
    case 'sessionLength':
      return SESSION_LENGTH_OPTIONS.map(o => ({ id: String(o.id), label: o.label }));
    case 'units':
      return UNIT_OPTIONS.map(o => ({ id: o.id, label: o.label }));
    default:
      return [];
  }
}

async function handleOnboardingChat(
  request: NextRequest,
  { userId }: { userId: string }
) {
  // Apply rate limiting (now async with Firestore)
  const rateLimitResult = await applyRateLimit(userId, 'onboardingChat');
  if (rateLimitResult) {
    return rateLimitResult;
  }

  try {
    // Parse and validate request body
    const rawBody = await request.json();
    const validation = validateRequest(onboardingChatRequestSchema, rawBody);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const { messages, collectedData, userConfirmed } = validation.data;

    logger.log('Onboarding chat request from user:', userId);

    // Convert Zod's undefined to null for OnboardingState compatibility
    const normalizedData: OnboardingState = {
      goals: collectedData?.goals ?? null,
      limitations: collectedData?.limitations ?? null,
      equipment: collectedData?.equipment ?? null,
      experienceLevel: collectedData?.experienceLevel ?? null,
      workoutDays: collectedData?.workoutDays ?? null,
      sessionLength: collectedData?.sessionLength ?? null,
      units: collectedData?.units ?? null,
    };

    const systemPrompt = buildSystemPrompt(normalizedData, userConfirmed);

    const anthropic = await getAnthropicClient();
    const response = await anthropic.messages.create({
      model: MODEL_CONFIG.onboarding.model,
      max_tokens: MODEL_CONFIG.onboarding.maxTokens,
      system: systemPrompt,
      tools,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    });

    // Process the response
    const extractedData: { field: keyof OnboardingState; value: string | string[] | number }[] = [];
    let suggestedOptions: OnboardingChatResponse['suggestedOptions'] | undefined;
    let isComplete = false;
    let assistantMessage = '';

    for (const block of response.content) {
      if (block.type === 'text') {
        assistantMessage += block.text;
      } else if (block.type === 'tool_use') {
        if (block.name === 'save_onboarding_field') {
          const input = block.input as { field: keyof OnboardingState; value: unknown };
          const validValue = validateAndNormalizeValue(input.field, input.value);
          if (validValue !== null) {
            extractedData.push({
              field: input.field,
              value: validValue,
            });
          }
        } else if (block.name === 'suggest_options') {
          const input = block.input as { field: keyof OnboardingState; multiSelect: boolean };
          suggestedOptions = {
            field: input.field,
            options: getOptionsForField(input.field),
            multiSelect: input.multiSelect,
          };
        } else if (block.name === 'confirm_onboarding') {
          isComplete = true;
        }
      }
    }

    // If there were tool calls but no text, we need to continue the conversation
    if (!assistantMessage && response.stop_reason === 'tool_use') {
      // Build tool results and continue
      const toolResults: Anthropic.ToolResultBlockParam[] = response.content
        .filter((block): block is Anthropic.ToolUseBlock => block.type === 'tool_use')
        .map((block) => ({
          type: 'tool_result' as const,
          tool_use_id: block.id,
          content: 'Saved successfully',
        }));

      const continuedResponse = await anthropic.messages.create({
        model: MODEL_CONFIG.onboarding.model,
        max_tokens: MODEL_CONFIG.onboarding.maxTokens,
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
            content: toolResults,
          },
        ],
      });

      for (const block of continuedResponse.content) {
        if (block.type === 'text') {
          assistantMessage += block.text;
        } else if (block.type === 'tool_use') {
          if (block.name === 'suggest_options') {
            const input = block.input as { field: keyof OnboardingState; multiSelect: boolean };
            suggestedOptions = {
              field: input.field,
              options: getOptionsForField(input.field),
              multiSelect: input.multiSelect,
            };
          } else if (block.name === 'confirm_onboarding') {
            isComplete = true;
          }
        }
      }
    }

    const result: OnboardingChatResponse = {
      message: assistantMessage || "I'm here to help you get set up!",
      extractedData,
      isComplete,
      suggestedOptions,
    };

    const jsonResponse = NextResponse.json(result);

    // Add rate limit headers (now async with Firestore)
    const rateLimitHeaders = await getRateLimitHeaders(userId, 'onboardingChat');
    Object.entries(rateLimitHeaders).forEach(([key, value]) => {
      jsonResponse.headers.set(key, value);
    });

    return jsonResponse;
  } catch (error) {
    logger.error('Onboarding chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to get response from AI' },
      { status: 500 }
    );
  }
}

// Export POST handler wrapped with authentication
export const POST = withAuth(handleOnboardingChat);
