/**
 * Client-side helpers for chat streaming.
 *
 * @module lib/api-chat-client
 */

import React from 'react';
import type { TranslationDictionary } from '@/lib/i18n';

export interface ToolCallData {
  name: string;
  args: Record<string, unknown>;
  reason?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolCalls?: ToolCallData[];
}

export interface SessionContextState {
  sessionId: string;
  language: string;
  accessibilityMode: boolean;
  currentZone?: string;
  ticketSection?: string;
  hasAskedAboutAccessibility: boolean;
}

function processChunk(
  chunk: { type: string; content?: string; toolCall?: ToolCallData },
  assistantId: string,
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>,
  sessionContext: SessionContextState,
  onContextUpdate: (updates: Partial<SessionContextState>) => void
) {
  if (chunk.type === 'text' && chunk.content) {
    setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + chunk.content } : m)));
  } else if (chunk.type === 'tool_call' && chunk.toolCall) {
    setMessages((prev) => prev.map((m) => {
      if (m.id !== assistantId) return m;
      const tc = [...(m.toolCalls || []), chunk.toolCall as ToolCallData];
      return { ...m, toolCalls: tc };
    }));
  } else if (chunk.type === 'done') {
    setMessages((prev) => {
      const astMsg = prev.find((m) => m.id === assistantId);
      if (astMsg?.content.includes('accessibility') && !sessionContext.hasAskedAboutAccessibility) {
        onContextUpdate({ hasAskedAboutAccessibility: true });
      }
      return prev;
    });
  }
}

export async function processStreamResponse(
  body: ReadableStream<Uint8Array>,
  assistantId: string,
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>,
  sessionContext: SessionContextState,
  onContextUpdate: (updates: Partial<SessionContextState>) => void
) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      try {
        const chunk = JSON.parse(line.slice(6)) as { type: string; content?: string; toolCall?: ToolCallData };
        processChunk(chunk, assistantId, setMessages, sessionContext, onContextUpdate);
      } catch { /* ignore malformed */ }
    }
  }
}

export async function sendChatRequest(
  message: string,
  sessionContext: SessionContextState,
  history: { role: string; content: string }[],
  signal: AbortSignal
) {
  return fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      context: sessionContext,
      history,
    }),
    signal,
  });
}

export async function executeChatRequest(
  messageText: string,
  sessionContext: SessionContextState,
  history: { role: string; content: string }[],
  assistantId: string,
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>,
  onContextUpdate: (updates: Partial<SessionContextState>) => void,
  translations: TranslationDictionary,
  signal: AbortSignal
) {
  try {
    const response = await sendChatRequest(messageText, sessionContext, history, signal);

    if (response.status === 429) {
      setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, content: translations.ui.rateLimitMessage } : m)));
      return;
    }

    if (!response.ok || !response.body) {
      setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, content: translations.ui.errorMessage } : m)));
      return;
    }

    await processStreamResponse(
      response.body,
      assistantId,
      setMessages,
      sessionContext,
      onContextUpdate
    );
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'AbortError') return;
    setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, content: translations.ui.errorMessage } : m)));
  }
}
