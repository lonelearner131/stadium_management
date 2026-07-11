/**
 * Health check endpoint.
 * Returns a simple JSON response indicating the server is running.
 *
 * @module app/api/health/route
 */

import { NextResponse } from 'next/server';

export const runtime = 'edge';
export const revalidate = 60;

/**
 * GET /api/health — health check endpoint.
 *
 * @returns JSON with status "ok" and timestamp
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
}
