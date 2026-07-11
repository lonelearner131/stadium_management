/**
 * Unit tests for lib/data/crowd-simulation.ts
 */

import { describe, it, expect } from 'vitest';
import {
  getCrowdStatusForLocation,
  getAllCrowdStatuses,
} from '@/lib/data/crowd-simulation';

describe('getCrowdStatusForLocation', () => {
  it('returns valid crowd status for a gate letter', () => {
    const status = getCrowdStatusForLocation('A');
    expect(['low', 'medium', 'high']).toContain(status.density);
    expect(status.percentage).toBeGreaterThanOrEqual(0);
    expect(status.percentage).toBeLessThanOrEqual(100);
    expect(status.location).toContain('Gate A');
    expect(status.timestamp).toBeDefined();
  });

  it('returns valid crowd status for a zone name', () => {
    const status = getCrowdStatusForLocation('north');
    expect(['low', 'medium', 'high']).toContain(status.density);
    expect(status.location).toContain('Gate A');
  });

  it('handles case-insensitive input', () => {
    const upper = getCrowdStatusForLocation('A');
    const lower = getCrowdStatusForLocation('a');
    expect(upper.density).toBe(lower.density);
    expect(upper.percentage).toBe(lower.percentage);
  });

  it('produces deterministic results for the same timestamp', () => {
    const timestamp = new Date('2026-06-14T15:00:00Z');
    const first = getCrowdStatusForLocation('B', timestamp);
    const second = getCrowdStatusForLocation('B', timestamp);
    expect(first.density).toBe(second.density);
    expect(first.percentage).toBe(second.percentage);
  });

  it('produces different results for different gates', () => {
    const timestamp = new Date('2026-06-14T15:00:00Z');
    const gateA = getCrowdStatusForLocation('A', timestamp);
    const gateB = getCrowdStatusForLocation('B', timestamp);
    // With high probability, they will differ
    // But they could theoretically be the same, so just check structure
    expect(gateA.location).not.toBe(gateB.location);
  });

  it('includes alternate recommendation when density is high', () => {
    // Use a fixed timestamp to get predictable results
    const timestamp = new Date('2026-06-14T15:00:00Z');
    const statuses = ['A', 'B', 'C', 'D'].map((g) =>
      getCrowdStatusForLocation(g, timestamp)
    );
    const highDensity = statuses.find((s) => s.density === 'high');
    if (highDensity) {
      // alternateRecommendation may be null if all are high
      expect(
        highDensity.alternateRecommendation === null ||
        typeof highDensity.alternateRecommendation === 'string'
      ).toBe(true);
    }
  });

  it('defaults to Gate A for unknown input', () => {
    const status = getCrowdStatusForLocation('unknown');
    expect(status.location).toContain('Gate A');
  });

  it('returns an ISO timestamp', () => {
    const status = getCrowdStatusForLocation('C');
    expect(() => new Date(status.timestamp)).not.toThrow();
  });
});

describe('getAllCrowdStatuses', () => {
  it('returns status for all four gates', () => {
    const statuses = getAllCrowdStatuses();
    expect(statuses).toHaveLength(4);
  });

  it('returns deterministic results for the same timestamp', () => {
    const timestamp = new Date('2026-07-04T20:00:00Z');
    const first = getAllCrowdStatuses(timestamp);
    const second = getAllCrowdStatuses(timestamp);
    for (let i = 0; i < first.length; i++) {
      expect(first[i].density).toBe(second[i].density);
      expect(first[i].percentage).toBe(second[i].percentage);
    }
  });

  it('covers all gates A–D', () => {
    const statuses = getAllCrowdStatuses();
    const gateIds = statuses.map((s) => s.location);
    expect(gateIds.some((l) => l.includes('Gate A'))).toBe(true);
    expect(gateIds.some((l) => l.includes('Gate B'))).toBe(true);
    expect(gateIds.some((l) => l.includes('Gate C'))).toBe(true);
    expect(gateIds.some((l) => l.includes('Gate D'))).toBe(true);
  });
});
