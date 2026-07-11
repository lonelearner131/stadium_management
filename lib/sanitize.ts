/**
 * Input sanitization utilities to prevent XSS and prompt injection.
 *
 * @module lib/sanitize
 */

/**
 * Sanitizes user input by removing/escaping potentially dangerous content.
 * Prevents XSS by escaping HTML entities and strips common prompt injection patterns.
 *
 * @param input - The raw user input string
 * @returns The sanitized string
 */
export function sanitizeInput(input: string): string {
  // First, trim and normalize whitespace
  let sanitized = input.trim().replace(/\s+/g, ' ');

  // Escape HTML entities to prevent XSS
  sanitized = escapeHtml(sanitized);

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');

  // Strip common prompt injection patterns
  // These patterns attempt to override system prompts or inject instructions
  sanitized = sanitized
    .replace(/\b(ignore|disregard|forget)\s+(all\s+)?(previous|prior|above)\s+(instructions?|prompts?|rules?)\b/gi, '[filtered]')
    .replace(/\b(system|assistant)\s*:\s*/gi, '')
    .replace(/```[\s\S]*?```/g, (match) => match.slice(0, 200)); // Limit code blocks

  return sanitized;
}

/**
 * Escapes HTML special characters to prevent XSS.
 *
 * @param text - The text to escape
 * @returns HTML-escaped text
 */
export function escapeHtml(text: string): string {
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
  };

  return text.replace(/[&<>"']/g, (char) => htmlEntities[char] ?? char);
}

/**
 * Sanitizes AI output for safe rendering.
 * Allows safe markdown formatting while blocking dangerous HTML.
 *
 * @param output - The AI model's response text
 * @returns Sanitized output safe for rendering
 */
export function sanitizeOutput(output: string): string {
  // Remove any raw HTML tags except safe markdown-converted ones
  let sanitized = output
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replace(/<object[\s\S]*?<\/object>/gi, '')
    .replace(/<embed[\s\S]*?>/gi, '')
    .replace(/<link[\s\S]*?>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/javascript\s*:/gi, '');

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');

  return sanitized;
}
