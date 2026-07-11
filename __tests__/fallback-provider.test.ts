/**
 * Unit tests for lib/ai/fallback-provider.ts — deterministic fallback logic.
 */

import { describe, it, expect } from 'vitest';
import { FallbackProvider } from '@/lib/ai/fallback-provider';
import type { GenerateOptions } from '@/lib/ai/provider';

function makeOptions(message: string, overrides?: Partial<GenerateOptions>): GenerateOptions {
  return {
    message,
    history: [],
    sessionContext: {
      sessionId: 'test-session',
      language: 'en',
      accessibilityMode: false,
      hasAskedAboutAccessibility: true, // Suppress accessibility prompt for cleaner tests
      ...overrides?.sessionContext,
    },
    systemPrompt: 'You are a test assistant.',
    ...overrides,
  };
}

async function collectStream(provider: FallbackProvider, options: GenerateOptions): Promise<string> {
  let text = '';
  for await (const chunk of provider.generateStream(options)) {
    if (chunk.type === 'text' && chunk.content) {
      text += chunk.content;
    }
  }
  return text;
}

describe('FallbackProvider - Basic Properties', () => {
  const provider = new FallbackProvider();

  it('is always available', () => {
    expect(provider.isAvailable()).toBe(true);
  });

  it('has name "fallback"', () => {
    expect(provider.name).toBe('fallback');
  });
});

describe('FallbackProvider - Intent Matching', () => {
  const provider = new FallbackProvider();

  it('matches gate-finding queries with a section number', async () => {
    const text = await collectStream(provider, makeOptions('Find my gate for section 101'));
    expect(text).toContain('Gate A');
  });

  it('asks for section when gate query lacks one', async () => {
    const text = await collectStream(provider, makeOptions('Find my gate'));
    expect(text.toLowerCase()).toContain('section');
  });

  it('matches crowd status queries', async () => {
    const text = await collectStream(provider, makeOptions('How busy is gate B?'));
    expect(text).toContain('Gate B');
  });

  it('matches transportation queries', async () => {
    const text = await collectStream(provider, makeOptions('How do I get to the stadium by bus?'));
    expect(text.toLowerCase()).toMatch(/transport|bus|train|shuttle/i);
  });

  it('matches restroom queries', async () => {
    const text = await collectStream(provider, makeOptions('Where is the nearest restroom?'));
    expect(text.toLowerCase()).toContain('restroom');
  });

  it('matches accessibility queries', async () => {
    const text = await collectStream(provider, makeOptions('I need a wheelchair accessible route'));
    expect(text.toLowerCase()).toMatch(/accessible|step-free|ramp|elevator/i);
  });

  it('matches prayer room queries', async () => {
    const text = await collectStream(provider, makeOptions('Where is the prayer room?'));
    expect(text.toLowerCase()).toContain('prayer');
  });

  it('matches water refill / sustainability queries', async () => {
    const text = await collectStream(provider, makeOptions('Where can I refill my water bottle?'));
    expect(text.toLowerCase()).toMatch(/water|refill/i);
  });

  it('matches translation queries', async () => {
    const text = await collectStream(provider, makeOptions('How do you say Goal! in Spanish?'));
    expect(text.length).toBeGreaterThan(0);
  });
});

describe('FallbackProvider - Fallback Responses', () => {
  const provider = new FallbackProvider();

  it('responds to greetings', async () => {
    const text = await collectStream(provider, makeOptions('Hello!'));
    expect(text.toLowerCase()).toContain('welcome');
  });

  it('responds to help requests', async () => {
    const text = await collectStream(provider, makeOptions('What can you do?'));
    expect(text).toContain('gate');
  });

  it('provides a general response for unmatched queries', async () => {
    const text = await collectStream(provider, makeOptions('Tell me about quantum physics'));
    expect(text.toLowerCase()).toContain('stadium');
  });
});

describe('FallbackProvider - Accessibility Mode', () => {
  const provider = new FallbackProvider();

  it('includes accessibility info when mode is enabled', async () => {
    const text = await collectStream(
      provider,
      makeOptions('Find my gate for section 101', {
        sessionContext: {
          sessionId: 'test',
          language: 'en',
          accessibilityMode: true,
          hasAskedAboutAccessibility: true,
        },
      })
    );
    expect(text).toMatch(/accessible|ramp|elevator|♿/i);
  });
});

describe('FallbackProvider - Streaming', () => {
  const provider = new FallbackProvider();

  it('emits a done chunk at the end', async () => {
    const chunks = [];
    for await (const chunk of provider.generateStream(makeOptions('Hello'))) {
      chunks.push(chunk);
    }
    expect(chunks[chunks.length - 1].type).toBe('done');
  });

  it('emits text chunks for the response', async () => {
    const chunks = [];
    for await (const chunk of provider.generateStream(makeOptions('Hello'))) {
      chunks.push(chunk);
    }
    const textChunks = chunks.filter((c) => c.type === 'text');
    expect(textChunks.length).toBeGreaterThan(0);
  });
});
