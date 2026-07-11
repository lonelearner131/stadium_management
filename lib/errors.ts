/**
 * Standardized application error class.
 * Ensures consistent error handling and logging without leaking internals.
 *
 * @module lib/errors
 */

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  /**
   * Creates an instance of AppError.
   *
   * @param message - User-friendly error message
   * @param statusCode - HTTP status code (default 500)
   * @param isOperational - Whether it's a known operational error (default true)
   */
  constructor(message: string, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this);
  }
}

/**
 * Safely handles and normalizes errors to AppError.
 *
 * @param error - The caught error
 * @returns An instance of AppError
 */
export function normalizeError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }
  if (error instanceof Error) {
    return new AppError(error.message);
  }
  return new AppError('An unexpected error occurred');
}
