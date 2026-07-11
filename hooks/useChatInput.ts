/**
 * Custom hook for chat input logic.
 *
 * @module hooks/useChatInput
 */
import { useRef, useEffect, useCallback, type FormEvent, type KeyboardEvent } from 'react';

export function useChatInput(
  input: string,
  setInput: (value: string) => void,
  sendMessage: (message: string) => void
) {
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      sendMessage(input);
      setInput('');
    },
    [input, sendMessage, setInput]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage(input);
        setInput('');
      }
    },
    [input, sendMessage, setInput]
  );

  return { inputRef, handleSubmit, handleKeyDown };
}
