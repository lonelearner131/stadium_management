/**
 * Shared helpers for AI providers.
 *
 * @module lib/ai/shared
 */

import { executeTool } from '@/lib/ai/tools';
import type { ToolCall, StreamChunk } from '@/lib/ai/provider';

/**
 * Executes a parsed tool call and yields the tool_call and tool_result chunks.
 *
 * @param toolCall - Parsed tool call to execute
 * @param accessibilityMode - Whether accessibility mode is on
 * @returns Array of stream chunks to yield
 */
export function processToolCall(toolCall: ToolCall, accessibilityMode: boolean) {
  const chunks: StreamChunk[] = [];
  chunks.push({ type: 'tool_call', toolCall });

  const toolResult = executeTool(toolCall, accessibilityMode);
  chunks.push({ type: 'tool_result', toolResult });

  return { chunks, toolResult };
}

import type { ChatSession, Part } from '@google/generative-ai';

export async function* handleGeminiToolCall(
  chat: ChatSession,
  part: Part,
  accessibilityMode: boolean
): AsyncIterable<StreamChunk> {
  if (!part.functionCall) return;
  const toolCall: ToolCall = {
    name: part.functionCall.name,
    args: (part.functionCall.args as Record<string, string>) ?? {},
  };
  yield { type: 'tool_call', toolCall };
  
  const toolResult = executeTool(toolCall, accessibilityMode);
  yield { type: 'tool_result', toolResult };
  
  const functionResponseResult = await chat.sendMessageStream([
    {
      functionResponse: {
        name: toolCall.name,
        response: toolResult.result as Record<string, unknown>,
      },
    },
  ]);
  
  for await (const responseChunk of functionResponseResult.stream) {
    const responseCandidate = responseChunk.candidates?.[0];
    if (!responseCandidate) continue;
    for (const responsePart of responseCandidate.content.parts) {
      if (responsePart.text) {
        yield { type: 'text' as const, content: responsePart.text };
      }
    }
  }
}
