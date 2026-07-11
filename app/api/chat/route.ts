/**
 * Chat API endpoint — POST /api/chat
 * Streams AI responses using the provider pattern.
 * Validates input, sanitizes, rate-limits, and streams.
 *
 * @module app/api/chat/route
 */

import { NextRequest } from 'next/server';
import { ChatRequestSchema } from '@/lib/validation/schemas';
import { sanitizeInput, sanitizeOutput } from '@/lib/sanitize';
import { checkRateLimit } from '@/lib/rate-limit';
import { buildSystemPrompt } from '@/lib/ai/system-prompt';
import { GeminiProvider } from '@/lib/ai/gemini-provider';
import { FallbackProvider } from '@/lib/ai/fallback-provider';
import type { AIProvider, AIMessage } from '@/lib/ai/provider';

/**
 * Selects the appropriate AI provider.
 * Uses Gemini if available, otherwise falls back to the rule-based provider.
 *
 * @returns The selected AI provider
 */
function getProvider(): AIProvider {
  const gemini = new GeminiProvider();
  if (gemini.isAvailable()) {
    return gemini;
  }
  return new FallbackProvider();
}

/**
 * POST /api/chat — Main chat endpoint.
 * Accepts a message, validates/sanitizes it, and streams back an AI response.
 *
 * @param request - The incoming HTTP request
 * @returns A streaming response or error JSON
 */
export async function POST(request: NextRequest): Promise<Response> {
  // Rate limiting
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    '127.0.0.1';

  const rateCheck = checkRateLimit(ip);
  if (!rateCheck.allowed) {
    return new Response(
      JSON.stringify({
        error: 'Rate limit exceeded',
        retryAfterMs: rateCheck.resetMs,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(Math.ceil(rateCheck.resetMs / 1000)),
        },
      }
    );
  }

  // Parse and validate request body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid JSON body' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const parseResult = ChatRequestSchema.safeParse(body);
  if (!parseResult.success) {
    return new Response(
      JSON.stringify({
        error: 'Validation failed',
        details: parseResult.error.issues.map((i) => ({
          path: i.path.join('.'),
          message: i.message,
        })),
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const { message, context, history } = parseResult.data;

  // Sanitize message
  const sanitizedMessage = sanitizeInput(message);

  // Build session context with defaults
  const sessionContext = {
    sessionId: context?.sessionId,
    language: context?.language ?? 'en',
    accessibilityMode: context?.accessibilityMode ?? false,
    currentZone: context?.currentZone,
    ticketSection: context?.ticketSection,
    hasAskedAboutAccessibility: context?.hasAskedAboutAccessibility ?? false,
  };

  // Build conversation history
  const aiHistory: AIMessage[] = (history ?? []).map((msg) => ({
    role: msg.role,
    content: msg.content,
  }));

  // Build system prompt
  const systemPrompt = buildSystemPrompt(sessionContext);

  // Get provider
  const provider = getProvider();

  // Stream response
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        let usedFallback = false;

        // Try primary provider, fall back if it errors
        const providerToUse = provider;
        const streamIterable = providerToUse.generateStream({
          message: sanitizedMessage,
          history: aiHistory,
          sessionContext,
          systemPrompt,
        });

        for await (const chunk of streamIterable) {
          if (chunk.type === 'error' && providerToUse.name === 'gemini' && !usedFallback) {
            // Gemini errored — switch to fallback
            usedFallback = true;
            const fallback = new FallbackProvider();
            const fallbackStream = fallback.generateStream({
              message: sanitizedMessage,
              history: aiHistory,
              sessionContext,
              systemPrompt,
            });

            for await (const fallbackChunk of fallbackStream) {
              if (fallbackChunk.type === 'text' && fallbackChunk.content) {
                const sanitized = sanitizeOutput(fallbackChunk.content);
                const data = JSON.stringify({ type: 'text', content: sanitized });
                controller.enqueue(encoder.encode(`data: ${data}\n\n`));
              } else if (fallbackChunk.type === 'done') {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
              }
            }
            break;
          }

          if (chunk.type === 'text' && chunk.content) {
            const sanitized = sanitizeOutput(chunk.content);
            const data = JSON.stringify({ type: 'text', content: sanitized });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          } else if (chunk.type === 'done') {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
          }
        }
      } catch (error: unknown) {
        console.error('[Chat API] Stream error:', error);
        const errorMsg = JSON.stringify({ type: 'error', content: 'An error occurred processing your request.' });
        controller.enqueue(encoder.encode(`data: ${errorMsg}\n\n`));
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
