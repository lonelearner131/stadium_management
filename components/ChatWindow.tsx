/**
 * ChatWindow component — the main chat interface.
 * Handles message sending, streaming responses, and scroll management.
 *
 * @module components/ChatWindow
 */

'use client';

import { useState } from 'react';
import { useChatSession } from '@/hooks/useChatSession';
import { ChatMessagesList } from '@/components/ChatMessagesList';
import { ChatInputArea } from '@/components/ChatInputArea';
import { WelcomeScreen } from '@/components/WelcomeScreen';
import { QuickActionChips } from '@/components/QuickActionChips';
import { LiveStadiumInsight } from '@/components/LiveStadiumInsight';
import type { TranslationDictionary } from '@/lib/i18n';

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
 * The main chat window component.
 * Manages conversation state, streaming, and user interaction.
 */
export function ChatWindow({
  translations: t,
  sessionContext,
  onContextUpdate,
}: ChatWindowProps) {
  const { messages, isStreaming, sendMessage } = useChatSession(t, sessionContext, onContextUpdate);

  const [input, setInput] = useState('');


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
        <LiveStadiumInsight />
        {showWelcome && <WelcomeScreen t={t} />}

        <ChatMessagesList
          messages={messages}
          isStreaming={isStreaming}
          translations={t}
        />
      </div>

      <QuickActionChips
        translations={t}
        onChipClick={sendMessage}
        disabled={isStreaming}
      />

      <ChatInputArea
        input={input}
        setInput={setInput}
        isStreaming={isStreaming}
        sendMessage={sendMessage}
        t={t}
      />
    </div>
  );
}
