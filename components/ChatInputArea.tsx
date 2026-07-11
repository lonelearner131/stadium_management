/**
 * ChatInputArea component
 *
 * @module components/ChatInputArea
 */
import { useChatInput } from '@/hooks/useChatInput';
import type { TranslationDictionary } from '@/lib/i18n';

interface ChatInputAreaProps {
  input: string;
  setInput: (value: string) => void;
  isStreaming: boolean;
  sendMessage: (message: string) => void;
  t: TranslationDictionary;
}

export function ChatInputArea({ input, setInput, isStreaming, sendMessage, t }: ChatInputAreaProps) {
  const { inputRef, handleSubmit, handleKeyDown } = useChatInput(input, setInput, sendMessage);

  return (
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
  );
}
