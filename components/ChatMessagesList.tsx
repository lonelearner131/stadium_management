/**
 * ChatMessagesList component
 *
 * @module components/ChatMessagesList
 */
import { useEffect, useRef } from 'react';
import { MessageBubble } from '@/components/MessageBubble';
import type { ChatMessage } from '@/lib/api-chat-client';
import type { TranslationDictionary } from '@/lib/i18n';

interface ChatMessagesListProps {
  messages: ChatMessage[];
  isStreaming: boolean;
  translations: TranslationDictionary;
}

export function ChatMessagesList({ messages, isStreaming, translations: t }: ChatMessagesListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <>
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
          toolCalls={msg.toolCalls}
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
    </>
  );
}
