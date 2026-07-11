/**
 * Unit tests for lib/validation/schemas.ts — Zod validation schemas.
 */

import { describe, it, expect } from 'vitest';
import {
  ChatRequestSchema,
  SessionContextSchema,
  MessageSchema,
  MAX_MESSAGE_LENGTH,
} from '@/lib/validation/schemas';

describe('MessageSchema', () => {
  it('accepts valid user message', () => {
    const result = MessageSchema.safeParse({ role: 'user', content: 'Hello' });
    expect(result.success).toBe(true);
  });

  it('accepts valid assistant message', () => {
    const result = MessageSchema.safeParse({ role: 'assistant', content: 'Hi there!' });
    expect(result.success).toBe(true);
  });

  it('rejects empty content', () => {
    const result = MessageSchema.safeParse({ role: 'user', content: '' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid role', () => {
    const result = MessageSchema.safeParse({ role: 'system', content: 'test' });
    expect(result.success).toBe(false);
  });

  it('rejects overly long content', () => {
    const result = MessageSchema.safeParse({
      role: 'user',
      content: 'a'.repeat(MAX_MESSAGE_LENGTH + 1),
    });
    expect(result.success).toBe(false);
  });
});

describe('SessionContextSchema', () => {
  it('accepts valid session context', () => {
    const result = SessionContextSchema.safeParse({
      sessionId: 'abc-123',
      language: 'en',
      accessibilityMode: true,
    });
    expect(result.success).toBe(true);
  });

  it('applies defaults for optional fields', () => {
    const result = SessionContextSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.language).toBe('en');
      expect(result.data.accessibilityMode).toBe(false);
    }
  });

  it('rejects invalid language', () => {
    const result = SessionContextSchema.safeParse({ language: 'invalid' });
    expect(result.success).toBe(false);
  });

  it('rejects session ID with special characters', () => {
    const result = SessionContextSchema.safeParse({ sessionId: 'abc<script>' });
    expect(result.success).toBe(false);
  });

  it('accepts all supported languages', () => {
    for (const lang of ['en', 'es', 'fr', 'ar']) {
      const result = SessionContextSchema.safeParse({ language: lang });
      expect(result.success).toBe(true);
    }
  });
});

describe('ChatRequestSchema', () => {
  it('accepts a valid chat request', () => {
    const result = ChatRequestSchema.safeParse({
      message: 'Where is gate A?',
      context: { language: 'en' },
      history: [],
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty message', () => {
    const result = ChatRequestSchema.safeParse({ message: '' });
    expect(result.success).toBe(false);
  });

  it('rejects message exceeding max length', () => {
    const result = ChatRequestSchema.safeParse({
      message: 'a'.repeat(MAX_MESSAGE_LENGTH + 1),
    });
    expect(result.success).toBe(false);
  });

  it('accepts request without optional fields', () => {
    const result = ChatRequestSchema.safeParse({ message: 'Hello' });
    expect(result.success).toBe(true);
  });

  it('rejects too many history messages', () => {
    const history = Array.from({ length: 51 }, (_, i) => ({
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: `Message ${i}`,
    }));
    const result = ChatRequestSchema.safeParse({ message: 'test', history });
    expect(result.success).toBe(false);
  });

  it('provides detailed error messages', () => {
    const result = ChatRequestSchema.safeParse({ message: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.length).toBeGreaterThan(0);
    }
  });
});
