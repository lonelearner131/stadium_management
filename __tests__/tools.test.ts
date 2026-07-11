/**
 * Unit tests for lib/ai/tools.ts — all six tool functions.
 */

import { describe, it, expect } from 'vitest';
import {
  findGate,
  getAccessibleRoute,
  getCrowdStatus,
  getTransportOptions,
  getAmenity,
  translateQuickPhrase,
  executeTool,
} from '@/lib/ai/tools';

describe('findGate', () => {
  it('returns correct gate for a known section', () => {
    const result = findGate('101');
    expect(result.error).toBeUndefined();
    expect(result.gate).toBe('Gate A – Main Entrance');
    expect(result.gateId).toBe('A');
    expect(result.zone).toBe('north');
    expect(typeof result.walkTimeMinutes).toBe('number');
  });

  it('returns error for an unknown section', () => {
    const result = findGate('999');
    expect(result.error).toBe(true);
    expect(result.message).toContain('not found');
  });

  it('returns accessibility info when accessibility mode is on', () => {
    const result = findGate('101', true);
    expect(result.accessible).toBeDefined();
    expect(result.hasRamp).toBeDefined();
    expect(result.hasElevator).toBeDefined();
  });

  it('warns about non-accessible sections when accessibility mode is on', () => {
    // Section 115 is not accessible
    const result = findGate('115', true);
    expect(result.warning).toBeDefined();
    expect(result.nearestAccessibleSection).toBeDefined();
  });

  it('handles whitespace in section input', () => {
    const result = findGate('  101  ');
    expect(result.error).toBeUndefined();
    expect(result.gateId).toBe('A');
  });
});

describe('getAccessibleRoute', () => {
  it('returns a direct route when one exists', () => {
    const result = getAccessibleRoute('Gate A', 'Section 101');
    expect(result.stepFree).toBe(true);
    expect(result.estimatedMinutes).toBeDefined();
    expect(result.description).toBeDefined();
  });

  it('returns a reverse route when available', () => {
    const result = getAccessibleRoute('Section 101', 'Gate A');
    expect(result.stepFree).toBe(true);
  });

  it('returns a generic accessible route when no specific route exists', () => {
    const result = getAccessibleRoute('Gate A', 'Section 134');
    expect(result.stepFree).toBe(true);
    expect(result.note).toBeDefined(); // Generic route includes a note
  });

  it('always returns step-free routes', () => {
    const result = getAccessibleRoute('Gate B', 'Section 130');
    expect(result.stepFree).toBe(true);
  });
});

describe('getCrowdStatus', () => {
  it('returns valid density for a gate', () => {
    const result = getCrowdStatus('A');
    expect(['low', 'medium', 'high']).toContain(result.density);
    expect(typeof result.estimatedWaitMinutes).toBe('number');
    expect(result.location).toContain('Gate A');
  });

  it('returns valid density for a zone', () => {
    const result = getCrowdStatus('north');
    expect(['low', 'medium', 'high']).toContain(result.density);
  });

  it('provides an alternate recommendation when density is high', () => {
    // We can't guarantee high density, but we can verify the structure
    const result = getCrowdStatus('A');
    if (result.density === 'high') {
      // alternateRecommendation may be null if all gates are busy
      expect(result.alternateRecommendation === null || typeof result.alternateRecommendation === 'string').toBe(true);
    }
  });

  it('includes advice text', () => {
    const result = getCrowdStatus('B');
    expect(result.advice).toBeDefined();
    expect(typeof result.advice).toBe('string');
  });
});

describe('getTransportOptions', () => {
  it('returns transport options for a zone', () => {
    const result = getTransportOptions('north');
    expect(result.options).toBeDefined();
    expect(Array.isArray(result.options)).toBe(true);
    const options = result.options as Array<Record<string, unknown>>;
    expect(options.length).toBeGreaterThan(0);
  });

  it('sorts options by carbon label (lowest first)', () => {
    const result = getTransportOptions('east');
    const options = result.options as Array<Record<string, string>>;
    const carbonOrder: Record<string, number> = { zero: 0, low: 1, medium: 2, high: 3 };
    for (let i = 1; i < options.length; i++) {
      const prev = carbonOrder[options[i - 1].carbonLabel] ?? 3;
      const curr = carbonOrder[options[i].carbonLabel] ?? 3;
      expect(prev).toBeLessThanOrEqual(curr);
    }
  });

  it('includes sustainability notes', () => {
    const result = getTransportOptions('west');
    const options = result.options as Array<Record<string, string>>;
    for (const opt of options) {
      expect(opt.sustainabilityNote).toBeDefined();
    }
  });

  it('returns options even for an unknown zone', () => {
    const result = getTransportOptions('unknown');
    expect(result.options).toBeDefined();
    const options = result.options as unknown[];
    expect(options.length).toBeGreaterThan(0);
  });
});

describe('getAmenity', () => {
  it('finds restrooms near a zone', () => {
    const result = getAmenity('restroom', 'north');
    expect(result.error).toBeUndefined();
    expect(result.results).toBeDefined();
    const results = result.results as unknown[];
    expect(results.length).toBeGreaterThan(0);
  });

  it('finds prayer rooms', () => {
    const result = getAmenity('prayer_room');
    expect(result.results).toBeDefined();
    const results = result.results as unknown[];
    expect(results.length).toBeGreaterThan(0);
  });

  it('finds water refill stations (sustainability)', () => {
    const result = getAmenity('water_refill', 'east');
    expect(result.results).toBeDefined();
    const results = result.results as Array<Record<string, unknown>>;
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].sustainability).toBe(true);
  });

  it('filters for accessible amenities when accessibility mode is on', () => {
    const result = getAmenity('restroom', 'north', true);
    const results = result.results as Array<Record<string, boolean>>;
    for (const r of results) {
      expect(r.accessible).toBe(true);
    }
  });

  it('returns error for invalid amenity type', () => {
    const result = getAmenity('invalid_type');
    expect(result.error).toBe(true);
  });

  it('prioritizes results in the requested zone', () => {
    const result = getAmenity('restroom', 'east');
    const results = result.results as Array<Record<string, string>>;
    if (results.length > 1) {
      expect(results[0].zone).toBe('east');
    }
  });
});

describe('translateQuickPhrase', () => {
  it('translates a known English phrase to Spanish', () => {
    const result = translateQuickPhrase('Goal!', 'es');
    expect(result.translatedPhrase).toBe('¡Gol!');
    expect(result.targetLanguage).toBe('es');
  });

  it('translates a known English phrase to French', () => {
    const result = translateQuickPhrase('Thank you', 'fr');
    expect(result.translatedPhrase).toBe('Merci');
  });

  it('translates a known English phrase to Arabic', () => {
    const result = translateQuickPhrase('Help', 'ar');
    expect(result.translatedPhrase).toBe('مساعدة');
  });

  it('returns a note for unknown phrases', () => {
    const result = translateQuickPhrase('Some random sentence', 'es');
    expect(result.note).toBeDefined();
  });

  it('returns error for unsupported language', () => {
    const result = translateQuickPhrase('Hello', 'zh');
    expect(result.error).toBe(true);
  });
});

describe('executeTool', () => {
  it('dispatches to findGate correctly', () => {
    const result = executeTool({ name: 'findGate', args: { section: '101' } });
    expect(result.toolName).toBe('findGate');
    expect((result.result as Record<string, unknown>).gateId).toBe('A');
  });

  it('dispatches to getCrowdStatus correctly', () => {
    const result = executeTool({ name: 'getCrowdStatus', args: { gateOrZone: 'B' } });
    expect(result.toolName).toBe('getCrowdStatus');
    expect((result.result as Record<string, unknown>).location).toContain('Gate B');
  });

  it('handles unknown tools gracefully', () => {
    const result = executeTool({ name: 'unknownTool', args: {} });
    expect((result.result as Record<string, unknown>).error).toBe(true);
  });

  it('passes accessibility mode through', () => {
    const result = executeTool({ name: 'findGate', args: { section: '101' } }, true);
    expect((result.result as Record<string, unknown>).accessible).toBeDefined();
  });
});
