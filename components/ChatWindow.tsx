/**
 * ChatWindow component — the main chat interface.
 * Handles message sending, streaming responses, and scroll management.
 *
 * @module components/ChatWindow
 */

'use client';

import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  type FormEvent,
  type KeyboardEvent,
} from 'react';
import { MessageBubble } from '@/components/MessageBubble';
import { QuickActionChips } from '@/components/QuickActionChips';
import type { TranslationDictionary } from '@/lib/i18n';

/** A message in the chat history */
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

/** Session context passed to the API */
interface SessionContextState {
  sessionId: string;
  language: string;
  accessibilityMode: boolean;
  currentZone?: string;
  ticketSection?: string;
  hasAskedAboutAccessibility: boolean;
}

interface ChatWindowProps {
  /** Translation dictionary */
  translations: TranslationDictionary;
  /** Current session context */
  sessionContext: SessionContextState;
  /** Callback when session context needs updating */
  onContextUpdate: (updates: Partial<SessionContextState>) => void;
}

/**
 * Generates a simple unique ID for messages.
 *
 * @returns A unique string ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * The main chat window component.
 * Manages conversation state, streaming, and user interaction.
 */
export function ChatWindow({
  translations: t,
  sessionContext,
  onContextUpdate,
}: ChatWindowProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Auto-scroll to bottom on new messages
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  /**
   * Sends a message to the chat API and handles the streaming response.
   *
   * @param messageText - The message to send
   */
  const sendMessage = useCallback(
    async (messageText: string) => {
      const trimmed = messageText.trim();
      if (!trimmed || isStreaming) return;

      // Add user message
      const userMsg: ChatMessage = {
        id: generateId(),
        role: 'user',
        content: trimmed,
      };
      setMessages((prev) => [...prev, userMsg]);
      setInput('');
      setIsStreaming(true);

      // Create assistant placeholder
      const assistantId = generateId();
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: 'assistant', content: '' },
      ]);

      // Abort any in-flight request
      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: trimmed,
            context: sessionContext,
            history: messages.slice(-20).map((m) => ({
              role: m.role,
              content: m.content,
            })),
          }),
          signal: controller.signal,
        });

        if (response.status === 429) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, content: t.ui.rateLimitMessage }
                : m
            )
          );
          setIsStreaming(false);
          return;
        }

        if (!response.ok || !response.body) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, content: t.ui.errorMessage }
                : m
            )
          );
          setIsStreaming(false);
          return;
        }

        // Read the SSE stream
        const reader = response.body.getReader();
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
            const jsonStr = line.slice(6);

            try {
              const chunk = JSON.parse(jsonStr) as {
                type: string;
                content?: string;
              };

              if (chunk.type === 'text' && chunk.content) {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? { ...m, content: m.content + chunk.content }
                      : m
                  )
                );
              }

              if (chunk.type === 'done') {
                // Check if the assistant mentioned accessibility
                setMessages((prev) => {
                  const assistantMsg = prev.find((m) => m.id === assistantId);
                  if (
                    assistantMsg?.content.includes('accessibility') &&
                    !sessionContext.hasAskedAboutAccessibility
                  ) {
                    onContextUpdate({ hasAskedAboutAccessibility: true });
                  }
                  return prev;
                });
              }
            } catch {
              // Skip malformed chunks
            }
          }
        }
      } catch (error: unknown) {
        if (error instanceof Error && error.name === 'AbortError') {
          // Request was aborted — ignore
          return;
        }
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: t.ui.errorMessage }
              : m
          )
        );
      } finally {
        setIsStreaming(false);
      }
    },
    [isStreaming, messages, sessionContext, onContextUpdate, t]
  );

  /** Handle form submission */
  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      sendMessage(input);
    },
    [input, sendMessage]
  );

  /** Handle Enter key (Shift+Enter for newline) */
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage(input);
      }
    },
    [input, sendMessage]
  );

  /** Handle quick action chip click */
  const handleChipClick = useCallback(
    (message: string) => {
      sendMessage(message);
    },
    [sendMessage]
  );

  const showWelcome = messages.length === 0;

  return (
    <div className="chat-window" role="region" aria-label={t.a11y.chatRegion}>
      <div
        className="chat-messages"
        role="log"
        aria-live="polite"
        aria-atomic="false"
        aria-relevant="additions"
      >
        {showWelcome && (
          <div className="welcome-screen">
            <div className="welcome-icon" aria-hidden="true">
              ⚽
            </div>
            <h2>{t.ui.title}</h2>
            <p>{t.ui.welcomeMessage}</p>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            role={msg.role}
            content={msg.content}
            ariaLabel={
              msg.role === 'user'
                ? `${t.a11y.messageFrom}: ${msg.content}`
                : `${t.a11y.messageTo}: ${msg.content}`
            }
          />
        ))}

        {isStreaming && messages[messages.length - 1]?.content === '' && (
          <div className="typing-indicator" role="status" aria-label={t.ui.typingIndicator}>
            <div className="typing-dots">
              <div className="typing-dot" />
              <div className="typing-dot" />
              <div className="typing-dot" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <QuickActionChips
        translations={t}
        onChipClick={handleChipClick}
        disabled={isStreaming}
      />

      <form
        className="chat-input-area"
        onSubmit={handleSubmit}
        aria-label={t.a11y.sendMessage}
      >
        <div className="chat-input-wrapper">
          <textarea
            ref={inputRef}
            className="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t.ui.inputPlaceholder}
            aria-label={t.ui.inputPlaceholder}
            rows={1}
            maxLength={2000}
            disabled={isStreaming}
            id="chat-input"
          />
        </div>
        <button
          className="send-btn"
          type="submit"
          disabled={!input.trim() || isStreaming}
          aria-label={t.a11y.sendMessage}
          id="send-button"
        >
          ➤
        </button>
      </form>
    </div>
  );
}
