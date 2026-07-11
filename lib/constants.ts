/**
 * Application constants to avoid magic numbers and strings.
 *
 * @module lib/constants
 */

export const SYSTEM = {
  VERSION: '0.1.0',
  DEFAULT_LOCALE: 'en',
  MAX_MESSAGE_LENGTH: 500,
  CACHE_TTL_MS: 60 * 60 * 1000,
  CACHE_MAX_KEYS: 1000,
} as const;

export const RATE_LIMIT = {
  MAX_REQUESTS: 20,
  WINDOW_MS: 60 * 1000,
} as const;

export const UI = {
  TYPING_SPEED_MS: 15,
  CROWD_HIGH_WAIT_MINUTES: 10,
  CROWD_POLL_INTERVAL_MS: 5000,
} as const;

export const AI = {
  DEFAULT_MODEL: 'gemini-3.5-flash',
} as const;
