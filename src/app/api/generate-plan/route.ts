import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { userProfile } = await request.json();

    const systemPrompt = `You are an AI personal trainer creating a weekly workout plan. Generate a structured workout schedule based on the user's profile.

User Profile:
- Goals: ${userProfile.goals?.join(', ') || 'General fitness'}
- Limitations: ${userProfile.limitations?.join(', ') || 'None'}
- Equipment: ${userProfile.equipment || 'full_gym'}
- Experience Level: ${userProfile.experienceLevel || 'intermediate'}
- Preferred Workout Days: ${userProfile.workoutDays?.join(', ') || 'Monday, Wednesday, Friday'}
- Session Length: ${userProfile.sessionLength || 45} minutes

IMPORTANT: You MUST respond with ONLY valid JSON, no other text. The response must follow this exact structure:

{
  "workoutSchedule": [
    {
      "dayOfWeek": "monday",
      "workoutType": "upper_body",
      "workoutName": "Upper Body Strength",
      "exercises": [
        {
          "id": "ex1",
          "name": "Dumbbell Bench Press",
          "sets": 3,
          "reps": 10,
          "notes": "Start light, focus on form"
        }
      ]
    }
  ]
}

Rules:
1. Include all 7 days (monday through sunday)
2. Add rest days where appropriate (usually 2-3 per week)
3. For rest days, use workoutType: "rest" and empty exercises array
4. Consider user limitations when selecting exercises
5. Include 4-6 exercises per workout
6. Vary workout types: upper_body, lower_body, full_body, cardio, rest
7. Include warm-up exercises
8. Keep exercises appropriate for 60+ users (safe, effective)
9. Each exercise needs: id (string), name, sets (number), reps (number), and optional notes`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content:
            'Please generate a weekly workout plan for me based on my profile. Return ONLY the JSON object.',
        },
      ],
    });

    const responseText =
      response.content[0].type === 'text' ? response.content[0].text : '';

    // Parse the JSON response
    let workoutPlan;
    try {
      // Try to extract JSON from the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        workoutPlan = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      console.error('Response was:', responseText);
      return NextResponse.json(
        { error: 'Failed to parse workout plan' },
        { status: 500 }
      );
    }

    return NextResponse.json(workoutPlan);
  } catch (error) {
    console.error('Generate plan API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate workout plan' },
      { status: 500 }
    );
  }
}
