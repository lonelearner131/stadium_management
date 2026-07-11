/**
 * Integration tests for the /api/chat endpoint.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { POST } from '@/app/api/chat/route';
import { NextRequest } from 'next/server';
import { resetRateLimits } from '@/lib/rate-limit';

/**
 * Creates a mock NextRequest for testing.
 */
function createRequest(body: unknown, headers?: Record<string, string>): NextRequest {
  return new NextRequest('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': '127.0.0.1',
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

/**
 * Reads a streaming response body to completion.
 */
async function readStream(response: Response): Promise<string> {
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let result = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    result += decoder.decode(value, { stream: true });
  }
  return result;
}

describe('/api/chat', () => {
  beforeEach(() => {
    resetRateLimits();
  });

  it('returns a streaming response for valid input', async () => {
    const request = createRequest({
      message: 'Hello, can you help me?',
      context: { language: 'en' },
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('text/event-stream');

    const body = await readStream(response);
    expect(body).toContain('data:');
    expect(body).toContain('"type":"text"');
    expect(body).toContain('"type":"done"');
  });

  it('rejects empty message with 400', async () => {
    const request = createRequest({ message: '' });
    const response = await POST(request);
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body.error).toBe('Validation failed');
  });

  it('rejects oversized message with 400', async () => {
    const request = createRequest({ message: 'a'.repeat(2001) });
    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('rejects invalid JSON with 400', async () => {
    const request = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '127.0.0.1',
      },
      body: 'not json',
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('uses fallback provider when no API key is set', async () => {
    // Ensure GEMINI_API_KEY is not set
    const originalKey = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;

    const request = createRequest({
      message: 'Find my gate for section 101',
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const body = await readStream(response);
    expect(body).toContain('data:');
    // Should contain gate info from the fallback provider
    // Note: because it's streaming, 'Gate' and 'A' might be in separate chunks
    expect(body).toContain('Gate');
    expect(body).toContain('A');

    // Restore
    if (originalKey) process.env.GEMINI_API_KEY = originalKey;
  });

  it('handles rate limiting', async () => {
    // Send 21 requests from the same IP (limit is 20)
    const ip = '10.0.0.99';
    for (let i = 0; i < 20; i++) {
      const req = createRequest(
        { message: `Message ${i}` },
        { 'x-forwarded-for': ip }
      );
      const res = await POST(req);
      expect(res.status).toBe(200);
    }

    // 21st should be rate limited
    const req = createRequest(
      { message: 'One more' },
      { 'x-forwarded-for': ip }
    );
    const res = await POST(req);
    expect(res.status).toBe(429);

    const body = await res.json();
    expect(body.error).toBe('Rate limit exceeded');
  });
});
