/**
 * Chat API endpoint — POST /api/chat
 * Streams AI responses using the provider pattern.
 * Validates input, sanitizes, rate-limits, and streams.
 *
 * @module app/api/chat/route
 */

export const runtime = 'edge';

import { NextRequest } from 'next/server';
import { sanitizeInput } from '@/lib/sanitize';
import { buildSystemPrompt } from '@/lib/ai/system-prompt';
import { normalizeError } from '@/lib/errors';
import type { SessionContext } from '@/lib/validation/schemas';
import {
  handleRateLimit,
  parseAndValidateRequest,
  buildProviders,
  generateAndPipeStream,
  buildSessionContext,
  buildHistory,
} from '@/lib/api-chat-helpers';

import type { AIProvider, GenerateOptions } from '@/lib/ai/provider';

function createChatStream(
  providers: { primary: AIProvider; fallback: AIProvider },
  options: GenerateOptions
): ReadableStream {
  const encoder = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      try {
        await generateAndPipeStream(providers, options, controller, encoder);
      } catch (err: unknown) {
        const normalizedError = normalizeError(err);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', content: normalizedError.message })}\n\n`));
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
      } finally {
        controller.close();
      }
    },
  });
}

/**
 * POST /api/chat — Main chat endpoint.
 *
 * @param request - The incoming HTTP request
 * @returns A streaming response or error JSON
 */
export async function POST(request: NextRequest): Promise<Response> {
  const rateLimitResponse = handleRateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  const { data, error } = await parseAndValidateRequest(request);
  if (error) return error;

  const { message, context, history } = data!;
  const sanitizedMessage = sanitizeInput(message);

  const sessionContext = buildSessionContext(
    context as {
      sessionId?: string;
      language?: string;
      accessibilityMode?: boolean;
      currentZone?: string;
      ticketSection?: string;
      hasAskedAboutAccessibility?: boolean;
    }
  ) as SessionContext;
  if (context?.language) {
    sessionContext.language = context.language as 'en' | 'es' | 'fr' | 'ar';
  }
  const aiHistory = buildHistory(history as { role: string; content: string }[] | undefined);

  const systemPrompt = buildSystemPrompt(sessionContext);
  const providers = buildProviders();

  const options = {
    message: sanitizedMessage,
    history: aiHistory,
    sessionContext,
    systemPrompt,
  };
  const stream = createChatStream(providers, options);

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
