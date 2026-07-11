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

import { GoogleGenerativeAI, SchemaType, type FunctionDeclaration, type FunctionDeclarationSchemaProperty } from '@google/generative-ai';
import type { AIProvider, GenerateOptions, StreamChunk, ToolCall } from '@/lib/ai/provider';
import { toolDefinitions, executeTool } from '@/lib/ai/tools';

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
        model: 'gemini-3.5-flash',
        systemInstruction: options.systemPrompt,
        tools: toGeminiTools(),
      });

      // Build conversation history
      const history = options.history
        .filter((msg) => msg.role !== 'system')
        .map((msg) => ({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }],
        }));

      const chat = model.startChat({ history });

      // Send user message and get streaming response
      const streamResult = await chat.sendMessageStream(options.message);

      for await (const chunk of streamResult.stream) {
        const candidate = chunk.candidates?.[0];
        if (!candidate) continue;

        for (const part of candidate.content.parts) {
          if (part.text) {
            yield { type: 'text', content: part.text };
          }

          if (part.functionCall) {
            const toolCall: ToolCall = {
              name: part.functionCall.name,
              args: (part.functionCall.args as Record<string, string>) ?? {},
            };

            yield { type: 'tool_call', toolCall };

            // Execute the tool
            const toolResult = executeTool(
              toolCall,
              options.sessionContext.accessibilityMode
            );

            yield { type: 'tool_result', toolResult };

            // Send tool result back to the model
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
                  yield { type: 'text', content: responsePart.text };
                }
              }
            }
          }
        }
      }

      yield { type: 'done' };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown Gemini API error';
      console.error('[GeminiProvider] Error:', errorMessage);
      yield {
        type: 'error',
        content: `Gemini API error: ${errorMessage}`,
      };
      yield { type: 'done' };
    }
  }
}
