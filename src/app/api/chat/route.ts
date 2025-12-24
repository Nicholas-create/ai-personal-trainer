import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { messages, userContext } = await request.json();

    const systemPrompt = `You are an AI personal trainer assistant designed for users aged 60+. Your role is to:

1. Provide helpful, encouraging fitness advice tailored to older adults
2. Answer questions about exercises, modifications, and workout plans
3. Suggest exercise alternatives when users report pain or limitations
4. Adjust workout recommendations based on user feedback
5. Be supportive and understanding of physical limitations

User Context:
- Goals: ${userContext?.goals?.join(', ') || 'Not specified'}
- Limitations: ${userContext?.limitations?.join(', ') || 'None specified'}
- Equipment: ${userContext?.equipment || 'Not specified'}
- Experience Level: ${userContext?.experienceLevel || 'Not specified'}
- Preferred Workout Days: ${userContext?.workoutDays?.join(', ') || 'Not specified'}
- Session Length: ${userContext?.sessionLength || 45} minutes

Guidelines:
- Keep responses concise and easy to read
- Use simple, clear language (avoid jargon)
- Prioritize safety - always recommend consulting a doctor for pain/injuries
- Be encouraging but realistic
- Suggest modifications when appropriate
- Remember that recovery is important for this age group`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    });

    const assistantMessage =
      response.content[0].type === 'text' ? response.content[0].text : '';

    return NextResponse.json({ message: assistantMessage });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to get response from AI' },
      { status: 500 }
    );
  }
}
