/**
 * Google Gemini implementation of the AIProvider interface.
 * Uses the @google/generative-ai SDK to call Gemini models
 * with tool/function-calling support.
 *
 * Reads GEMINI_API_KEY from environment variables.
 * Falls back to FallbackProvider if the key is missing or API errors occur.
 *
 * @module ai/gemini-provider
 */

import { GoogleGenerativeAI, SchemaType, type FunctionDeclaration, type FunctionDeclarationSchemaProperty, type ChatSession, type Part } from '@google/generative-ai';
import type { AIProvider, GenerateOptions, StreamChunk } from '@/lib/ai/provider';
import { toolDefinitions } from '@/lib/ai/tools';
import { handleGeminiToolCall } from '@/lib/ai/shared';
import { normalizeError } from '@/lib/errors';

function mapHistory(history: { role: string; content: string }[]) {
  return history
    .filter((msg) => msg.role !== 'system')
    .map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));
}

async function* processGeminiChunk(
  chunk: unknown,
  chat: ChatSession,
  accessibilityMode: boolean
): AsyncIterable<StreamChunk> {
  const candidate = (chunk as { candidates?: { content: { parts: Part[] } }[] }).candidates?.[0];
  if (!candidate) return;

  for (const part of candidate.content.parts) {
    if (part.text) {
      yield { type: 'text' as const, content: part.text };
    }
    if (part.functionCall) {
      yield* handleGeminiToolCall(chat, part, accessibilityMode);
    }
  }
}

/**
 * Maps our tool parameter definitions to Google's FunctionDeclaration format.
 */
function toGeminiTools() {
  return [
    {
      functionDeclarations: toolDefinitions.map((tool) => ({
        name: tool.name,
        description: tool.description,
        parameters: {
          type: tool.parameters.type.toUpperCase() === 'OBJECT' ? SchemaType.OBJECT : SchemaType.STRING,
          properties: Object.fromEntries(
            Object.entries(tool.parameters.properties || {}).map(([key, val]) => {
              const v = val as { type: string; description: string };
              return [
                key,
                {
                  type: v.type.toUpperCase() === 'STRING' ? SchemaType.STRING : SchemaType.OBJECT,
                  description: v.description,
                } as FunctionDeclarationSchemaProperty,
              ];
            })
          ),
          required: tool.parameters.required,
        },
      } as FunctionDeclaration)),
    },
  ];
}

/**
 * GeminiProvider — uses Google's Gemini API with function calling.
 */
export class GeminiProvider implements AIProvider {
  readonly name = 'gemini';
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
  }

  /**
   * Checks if the Gemini API key is configured.
   *
   * @returns true if GEMINI_API_KEY is set
   */
  isAvailable(): boolean {
    return Boolean(this.apiKey);
  }

  /**
   * Generates a streaming response using the Gemini API.
   * Handles tool calls by executing them and feeding results back.
   *
   * @param options - Generation options
   * @returns Async iterable of stream chunks
   */
  async *generateStream(options: GenerateOptions): AsyncIterable<StreamChunk> {
    if (!this.apiKey) {
      yield { type: 'error', content: 'Gemini API key not configured' };
      yield { type: 'done' };
      return;
    }

    try {
      const genAI = new GoogleGenerativeAI(this.apiKey);
      const model = genAI.getGenerativeModel({
        model: 'gemini-3-flash-preview',
        systemInstruction: options.systemPrompt,
        tools: toGeminiTools(),
      });

      const history = mapHistory(options.history);

      const chat = model.startChat({ history });

      // Send user message and get streaming response
      const streamResult = await chat.sendMessageStream(options.message);

      for await (const chunk of streamResult.stream) {
        yield* processGeminiChunk(chunk, chat, options.sessionContext.accessibilityMode);
      }

      yield { type: 'done' };
    } catch (err: unknown) {
      const normalizedError = normalizeError(err);
      yield {
        type: 'error',
        content: `Gemini API error: ${normalizedError.message}`,
      };
      yield { type: 'done' };
    }
  }
}
