/**
 * Zod validation schemas for all API inputs.
 * Enforces strict input validation and sanitization on every request.
 *
 * @module validation/schemas
 */

import { z } from 'zod';

/** Maximum allowed message length (characters) */
export const MAX_MESSAGE_LENGTH = 2000;

/** Maximum number of messages in a conversation context */
export const MAX_CONTEXT_MESSAGES = 50;

/** Supported language codes */
export const SUPPORTED_LANGUAGES = ['en', 'es', 'fr', 'ar'] as const;

/**
 * Schema for a single chat message in the conversation history.
 */
export const MessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1).max(MAX_MESSAGE_LENGTH),
});

/**
 * Schema for the session context that tracks user preferences.
 */
export const SessionContextSchema = z.object({
  sessionId: z
    .string()
    .max(64)
    .regex(/^[a-zA-Z0-9_-]+$/, 'Session ID must be alphanumeric with hyphens/underscores only')
    .optional(),
  language: z.enum(SUPPORTED_LANGUAGES).default('en'),
  accessibilityMode: z.boolean().default(false),
  currentZone: z.string().max(50).optional(),
  ticketSection: z.string().max(10).optional(),
  hasAskedAboutAccessibility: z.boolean().default(false),
});

/**
 * Schema for the main chat API request body.
 */
export const ChatRequestSchema = z.object({
  message: z
    .string()
    .min(1, 'Message cannot be empty')
    .max(MAX_MESSAGE_LENGTH, `Message cannot exceed ${MAX_MESSAGE_LENGTH} characters`),
  context: SessionContextSchema.optional(),
  history: z
    .array(MessageSchema)
    .max(MAX_CONTEXT_MESSAGES, `Cannot send more than ${MAX_CONTEXT_MESSAGES} messages`)
    .optional(),
});

/** Inferred type for ChatRequest */
export type ChatRequest = z.infer<typeof ChatRequestSchema>;

/** Inferred type for SessionContext */
export type SessionContext = z.infer<typeof SessionContextSchema>;

/** Inferred type for Message */
export type Message = z.infer<typeof MessageSchema>;
