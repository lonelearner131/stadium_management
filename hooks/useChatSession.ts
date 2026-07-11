/**
 * Hook to manage chat session state and messaging.
 * Encapsulates the logic for sending messages, receiving SSE streams, and updating context.
 *
 * @module hooks/useChatSession
 */

import { useState, useRef, useCallback } from 'react';
import type { TranslationDictionary } from '@/lib/i18n';
import {
  type ChatMessage,
  type SessionContextState,
  executeChatRequest,
} from '@/lib/api-chat-client';

export function useChatSession(
  translations: TranslationDictionary,
  sessionContext: SessionContextState,
  onContextUpdate: (updates: Partial<SessionContextState>) => void
) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  const sendMessage = useCallback(
    async (messageText: string) => {
      const trimmed = messageText.trim();
      if (!trimmed || isStreaming) return;

      const userMsg: ChatMessage = { id: generateId(), role: 'user', content: trimmed };
      setMessages((prev) => [...prev, userMsg]);
      setIsStreaming(true);

      const assistantId = generateId();
      setMessages((prev) => [...prev, { id: assistantId, role: 'assistant', content: '', toolCalls: [] }]);

      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      await executeChatRequest(
        trimmed,
        sessionContext,
        messages.slice(-20).map((m) => ({ role: m.role, content: m.content })),
        assistantId,
        setMessages,
        onContextUpdate,
        translations,
        controller.signal
      );
      setIsStreaming(false);
    },
    [isStreaming, messages, sessionContext, onContextUpdate, translations]
  );

  return { messages, isStreaming, sendMessage };
}
