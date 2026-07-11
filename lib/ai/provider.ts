/**
 * AIProvider interface — adapter pattern for swappable LLM vendors.
 * All AI providers must implement this interface, ensuring consistent
 * behavior whether using Gemini, a fallback, or any future provider.
 *
 * @module ai/provider
 */

import type { SessionContext } from '@/lib/validation/schemas';

/**
 * A tool call request from the AI model.
 */
export interface ToolCall {
  /** The name of the tool to invoke */
  name: string;
  /** The arguments to pass to the tool */
  args: Record<string, string>;
}

/**
 * Result of a tool execution.
 */
export interface ToolResult {
  /** The name of the tool that was called */
  toolName: string;
  /** The result data from the tool */
  result: unknown;
}

/**
 * A message in the conversation history for the AI provider.
 */
export interface AIMessage {
  /** The role of the message sender */
  role: 'user' | 'assistant' | 'system';
  /** The text content of the message */
  content: string;
}

/**
 * Options for generating a response.
 */
export interface GenerateOptions {
  /** The user's current message */
  message: string;
  /** Conversation history */
  history: AIMessage[];
  /** The user's session context */
  sessionContext: SessionContext;
  /** The system prompt to use */
  systemPrompt: string;
}

/**
 * A chunk of a streaming response.
 */
export interface StreamChunk {
  /** The type of chunk */
  type: 'text' | 'tool_call' | 'tool_result' | 'error' | 'done';
  /** Text content (for text chunks) */
  content?: string;
  /** Tool call data (for tool_call chunks) */
  toolCall?: ToolCall;
  /** Tool result data (for tool_result chunks) */
  toolResult?: ToolResult;
}

/**
 * Interface that all AI providers must implement.
 * This adapter pattern allows swapping between Gemini, a rule-based fallback,
 * or any future LLM provider without changing calling code.
 */
export interface AIProvider {
  /** Human-readable name of the provider */
  readonly name: string;

  /**
   * Generates a streaming response from the AI model.
   *
   * @param options - The generation options including message, history, and context
   * @returns An async iterable of stream chunks
   */
  generateStream(options: GenerateOptions): AsyncIterable<StreamChunk>;

  /**
   * Checks if the provider is currently available.
   *
   * @returns true if the provider can accept requests
   */
  isAvailable(): boolean;
}
