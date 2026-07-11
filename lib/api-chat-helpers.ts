/**
 * Helpers for the chat API route.
 *
 * @module lib/api-chat-helpers
 */

import { NextRequest } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { ChatRequestSchema } from '@/lib/validation/schemas';
import { sanitizeOutput } from '@/lib/sanitize';
import type { AIProvider, StreamChunk, GenerateOptions, AIMessage } from '@/lib/ai/provider';
import { GeminiProvider } from '@/lib/ai/gemini-provider';
import { FallbackProvider } from '@/lib/ai/fallback-provider';

export function handleRateLimit(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    '127.0.0.1';

  const rateCheck = checkRateLimit(ip);
  if (!rateCheck.allowed) {
    return new Response(
      JSON.stringify({ error: 'Rate limit exceeded', retryAfterMs: rateCheck.resetMs }),
      { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': String(Math.ceil(rateCheck.resetMs / 1000)) } }
    );
  }
  return null;
}

export async function parseAndValidateRequest(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return { error: new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400, headers: { 'Content-Type': 'application/json' } }) };
  }

  const parseResult = ChatRequestSchema.safeParse(body);
  if (!parseResult.success) {
    return {
      error: new Response(
        JSON.stringify({ error: 'Validation failed', details: parseResult.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })) }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      ),
    };
  }
  return { data: parseResult.data };
}

export function buildSessionContext(context: { sessionId?: string; language?: string; accessibilityMode?: boolean; currentZone?: string; ticketSection?: string; hasAskedAboutAccessibility?: boolean; } | undefined) {
  return {
    sessionId: context?.sessionId,
    language: context?.language ?? 'en',
    accessibilityMode: context?.accessibilityMode ?? false,
    currentZone: context?.currentZone,
    ticketSection: context?.ticketSection,
    hasAskedAboutAccessibility: context?.hasAskedAboutAccessibility ?? false,
  };
}

export function buildHistory(history: { role: string; content: string; }[] | undefined): AIMessage[] {
  return (history ?? []).map((msg) => ({
    role: msg.role as 'user' | 'assistant' | 'system',
    content: msg.content,
  }));
}

export function buildProviders(): { primary: AIProvider; fallback: AIProvider } {
  const gemini = new GeminiProvider();
  return { primary: gemini.isAvailable() ? gemini : new FallbackProvider(), fallback: new FallbackProvider() };
}

export async function handleStreamIteration(
  chunk: StreamChunk,
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder
) {
  if (chunk.type === 'text' && chunk.content) {
    const sanitized = sanitizeOutput(chunk.content);
    const data = JSON.stringify({ type: 'text', content: sanitized });
    controller.enqueue(encoder.encode(`data: ${data}\n\n`));
  } else if (chunk.type === 'tool_call') {
    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'tool_call', toolCall: chunk.toolCall })}\n\n`));
  } else if (chunk.type === 'done') {
    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
  }
}

export async function generateAndPipeStream(
  providers: { primary: AIProvider; fallback: AIProvider },
  options: GenerateOptions,
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder
) {
  let usedFallback = false;
  const streamIterable = providers.primary.generateStream(options);

  for await (const chunk of streamIterable) {
    if (chunk.type === 'error' && providers.primary.name === 'gemini' && !usedFallback) {
      usedFallback = true;
      const fallbackStream = providers.fallback.generateStream(options);
      for await (const fallbackChunk of fallbackStream) {
        await handleStreamIteration(fallbackChunk, controller, encoder);
      }
      break;
    }
    await handleStreamIteration(chunk, controller, encoder);
  }
}
