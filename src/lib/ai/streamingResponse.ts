import Anthropic from '@anthropic-ai/sdk';
import { getAnthropicClient, MODEL_CONFIG } from './anthropicClient';

/**
 * Streaming response utilities for AI chat
 *
 * Usage:
 * 1. Client sends request with `stream: true` parameter
 * 2. Server uses createStreamingChatResponse() instead of regular messages.create()
 * 3. Client reads response as SSE or ReadableStream
 *
 * Note: Streaming with tool use is complex - when Claude uses tools,
 * you'll receive tool_use blocks that need to be executed and fed back.
 * For now, this is best used for simple responses without tool calls.
 */

export interface StreamingChatOptions {
  systemPrompt: string;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  tools?: Anthropic.Tool[];
  onText?: (text: string) => void;
  onToolUse?: (toolUse: { name: string; id: string; input: unknown }) => void;
  onComplete?: (fullMessage: string) => void;
  onError?: (error: Error) => void;
}

/**
 * Create a streaming chat response
 * Returns an async generator that yields text chunks
 */
export async function* createStreamingChatResponse(
  options: StreamingChatOptions
): AsyncGenerator<string, void, unknown> {
  const { systemPrompt, messages, tools, onText, onToolUse, onComplete, onError } = options;

  try {
    const anthropic = await getAnthropicClient();

    const stream = await anthropic.messages.stream({
      model: MODEL_CONFIG.chat.model,
      max_tokens: MODEL_CONFIG.chat.maxTokens,
      system: systemPrompt,
      messages,
      ...(tools && { tools }),
    });

    let fullMessage = '';

    for await (const event of stream) {
      if (event.type === 'content_block_delta') {
        if (event.delta.type === 'text_delta') {
          const text = event.delta.text;
          fullMessage += text;
          onText?.(text);
          yield text;
        }
      } else if (event.type === 'content_block_start') {
        if (event.content_block.type === 'tool_use') {
          // Tool use detected - this needs special handling
          onToolUse?.({
            name: event.content_block.name,
            id: event.content_block.id,
            input: {},
          });
        }
      }
    }

    onComplete?.(fullMessage);
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    onError?.(err);
    throw err;
  }
}

/**
 * Create a ReadableStream for use with Response
 * Useful for returning streaming responses from API routes
 */
export function createStreamingResponse(
  options: Omit<StreamingChatOptions, 'onText' | 'onComplete' | 'onError'>
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      try {
        const generator = createStreamingChatResponse({
          ...options,
          onError: (error) => {
            controller.error(error);
          },
        });

        for await (const chunk of generator) {
          // Format as SSE
          const data = JSON.stringify({ type: 'text', content: chunk });
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        }

        // Send completion event
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });
}

/**
 * Create SSE headers for streaming response
 */
export function getStreamingHeaders(): HeadersInit {
  return {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  };
}
