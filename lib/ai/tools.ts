/**
 * Tool/function-calling schema and implementations for the Stadium Companion AI.
 * These tools provide grounded, factual responses about the stadium
 * instead of relying on AI hallucination.
 *
 * @module ai/tools
 */

import venueData from '@/lib/data/venue.json';
import { getCrowdStatusForLocation } from '@/lib/data/crowd-simulation';
import { translations, type Locale } from '@/lib/i18n';
import type { ToolCall, ToolResult } from '@/lib/ai/provider';

/* ------------------------------------------------------------------ */
/*  Types for venue data (loaded once at module scope)                 */
/* ------------------------------------------------------------------ */

interface Gate {
  id: string;
  name: string;
  zone: string;
  sections: string[];
  accessible: boolean;
  hasRamp: boolean;
  hasElevator: boolean;
  nearestParking: string;
  walkTimeMinutes: number;
}

interface Section {
  id: string;
  level: string;
  zone: string;
  gate: string;
  accessible: boolean;
  hasCompanionSeats: boolean;
}

interface AccessibleRoute {
  id: string;
  from: string;
  to: string;
  description: string;
  stepFree: boolean;
  estimatedMinutes: number;
  landmarks: string[];
}

interface Amenity {
  id: string;
  type: string;
  name: string;
  zone: string;
  accessible: boolean;
  level: string;
  familyFriendly?: boolean;
  sustainability?: boolean;
  features?: string[];
}

interface TransitOption {
  id: string;
  type: string;
  name: string;
  zone: string;
  nearestGate: string;
  schedule: string;
  accessible: boolean;
  carbonLabel: string;
  walkToGateMinutes: number;
}

/* ------------------------------------------------------------------ */
/*  Static data — loaded once at module scope                          */
/* ------------------------------------------------------------------ */

const gates: Gate[] = venueData.gates;
const sections: Section[] = venueData.sections;
const accessibleRoutes: AccessibleRoute[] = venueData.accessibleRoutes;
const amenities: Amenity[] = venueData.amenities;
const transit: TransitOption[] = venueData.transit;

/* ------------------------------------------------------------------ */
/*  Tool definitions (schema for AI model function-calling)            */
/* ------------------------------------------------------------------ */

/**
 * Tool definition schema for the AI model's function-calling interface.
 * Each tool describes its name, purpose, and required parameters.
 */
export const toolDefinitions = [
  {
    name: 'findGate',
    description:
      'Find the nearest gate for a given section number. Returns gate name, walk time, and accessible route information.',
    parameters: {
      type: 'object' as const,
      properties: {
        section: {
          type: 'string',
          description: 'The section number (e.g., "101", "125")',
        },
      },
      required: ['section'],
    },
  },
  {
    name: 'getAccessibleRoute',
    description:
      'Get a step-free, wheelchair-accessible route between two locations. Always use ramps and elevators, avoiding stairs.',
    parameters: {
      type: 'object' as const,
      properties: {
        from: {
          type: 'string',
          description: 'Starting location (e.g., "Gate A", "Section 101")',
        },
        to: {
          type: 'string',
          description: 'Destination (e.g., "Section 113", "Gate D")',
        },
      },
      required: ['from', 'to'],
    },
  },
  {
    name: 'getCrowdStatus',
    description:
      'Get the current crowd density at a gate or zone. Returns density level, estimated wait time, and alternate recommendations if crowded.',
    parameters: {
      type: 'object' as const,
      properties: {
        gateOrZone: {
          type: 'string',
          description: 'Gate letter (A, B, C, D) or zone name (north, east, south, west)',
        },
      },
      required: ['gateOrZone'],
    },
  },
  {
    name: 'getTransportOptions',
    description:
      'Get public transit, shuttle, and other transportation options from a given area. Lower-carbon options are listed first.',
    parameters: {
      type: 'object' as const,
      properties: {
        originArea: {
          type: 'string',
          description: 'The area/zone to get transport from (north, east, south, west)',
        },
      },
      required: ['originArea'],
    },
  },
  {
    name: 'getAmenity',
    description:
      'Find amenities of a specific type near a zone. Types: restroom, first_aid, prayer_room, family_room, water_refill, sustainability_station.',
    parameters: {
      type: 'object' as const,
      properties: {
        type: {
          type: 'string',
          description:
            'Amenity type: restroom, first_aid, prayer_room, family_room, water_refill, sustainability_station',
        },
        nearZone: {
          type: 'string',
          description: 'Zone to search near (north, east, south, west)',
        },
      },
      required: ['type'],
    },
  },
  {
    name: 'translateQuickPhrase',
    description: 'Translate a common fan phrase between languages.',
    parameters: {
      type: 'object' as const,
      properties: {
        phrase: {
          type: 'string',
          description: 'The phrase to translate',
        },
        targetLang: {
          type: 'string',
          description: 'Target language code (en, es, fr, ar)',
        },
      },
      required: ['phrase', 'targetLang'],
    },
  },
];

/* ------------------------------------------------------------------ */
/*  Tool implementations                                               */
/* ------------------------------------------------------------------ */

/**
 * Finds the nearest gate for a given section number.
 * Returns gate details including walk time and accessibility info.
 *
 * @param section - The section number to find the gate for
 * @param accessibilityMode - Whether to include step-free route info
 * @returns Object with gate details, or an error message
 */
export function findGate(
  section: string,
  accessibilityMode = false
): Record<string, unknown> {
  const sectionData = sections.find((s) => s.id === section.trim());

  if (!sectionData) {
    return {
      error: true,
      message: `Section "${section}" not found. Valid sections are 101–134.`,
    };
  }

  const gate = gates.find((g) => g.id === sectionData.gate);
  if (!gate) {
    return { error: true, message: `Gate data not found for section ${section}.` };
  }

  const result: Record<string, unknown> = {
    section: sectionData.id,
    sectionLevel: sectionData.level,
    gate: gate.name,
    gateId: gate.id,
    zone: gate.zone,
    walkTimeMinutes: gate.walkTimeMinutes,
    nearestParking: gate.nearestParking,
  };

  if (accessibilityMode) {
    result.accessible = gate.accessible;
    result.hasRamp = gate.hasRamp;
    result.hasElevator = gate.hasElevator;
    result.hasCompanionSeats = sectionData.hasCompanionSeats;
    result.sectionAccessible = sectionData.accessible;

    if (!sectionData.accessible) {
      // Find nearest accessible section in the same zone
      const nearestAccessible = sections.find(
        (s) => s.zone === sectionData.zone && s.accessible && s.id !== sectionData.id
      );
      result.warning =
        'This section may not be fully accessible.';
      result.nearestAccessibleSection = nearestAccessible?.id ?? 'Contact staff for assistance';
    }

    // Find accessible route from gate to section
    const route = accessibleRoutes.find(
      (r) =>
        r.from.includes(`Gate ${gate.id}`) &&
        r.to.includes(`Section ${sectionData.id}`)
    );
    if (route) {
      result.accessibleRoute = route.description;
      result.routeLandmarks = route.landmarks;
      result.routeEstimatedMinutes = route.estimatedMinutes;
    }
  }

  return result;
}

/**
 * Gets a step-free, accessible route between two locations.
 *
 * @param from - Starting location
 * @param to - Destination location
 * @returns Route details or a constructed accessible path
 */
export function getAccessibleRoute(
  from: string,
  to: string
): Record<string, unknown> {
  const fromNorm = from.trim();
  const toNorm = to.trim();

  // Try to find a direct route
  const directRoute = accessibleRoutes.find(
    (r) =>
      r.from.toLowerCase().includes(fromNorm.toLowerCase()) &&
      r.to.toLowerCase().includes(toNorm.toLowerCase())
  );

  if (directRoute) {
    return {
      from: directRoute.from,
      to: directRoute.to,
      description: directRoute.description,
      stepFree: directRoute.stepFree,
      estimatedMinutes: directRoute.estimatedMinutes,
      landmarks: directRoute.landmarks,
    };
  }

  // Try reverse direction
  const reverseRoute = accessibleRoutes.find(
    (r) =>
      r.from.toLowerCase().includes(toNorm.toLowerCase()) &&
      r.to.toLowerCase().includes(fromNorm.toLowerCase())
  );

  if (reverseRoute) {
    return {
      from: fromNorm,
      to: toNorm,
      description: `Reverse of: ${reverseRoute.description}`,
      stepFree: reverseRoute.stepFree,
      estimatedMinutes: reverseRoute.estimatedMinutes,
      landmarks: [...reverseRoute.landmarks].reverse(),
    };
  }

  // Construct a generic accessible route via the lower concourse
  return {
    from: fromNorm,
    to: toNorm,
    description:
      'Use the lower concourse accessible ring path. Follow blue accessibility signs. All elevators are located near the main gates (A, B, C, D). Ask any stadium staff member wearing a blue vest for personal assistance.',
    stepFree: true,
    estimatedMinutes: 10,
    landmarks: ['Lower Concourse', 'Accessibility Signs', 'Nearest Elevator Bank'],
    note: 'This is a general accessible route. For specific turn-by-turn directions, please ask a stadium accessibility ambassador.',
  };
}

/**
 * Gets the current crowd status for a gate or zone.
 *
 * @param gateOrZone - Gate letter or zone name
 * @returns Crowd density information with recommendations
 */
export function getCrowdStatus(gateOrZone: string): Record<string, unknown> {
  const status = getCrowdStatusForLocation(gateOrZone);
  return {
    location: status.location,
    density: status.density,
    estimatedWaitMinutes: status.estimatedWaitMinutes,
    percentage: status.percentage,
    alternateRecommendation: status.alternateRecommendation,
    timestamp: status.timestamp,
    advice:
      status.density === 'high'
        ? `This area is very busy. ${status.alternateRecommendation ? `Consider using ${status.alternateRecommendation} instead.` : 'Consider waiting 10-15 minutes for crowds to thin.'}`
        : status.density === 'medium'
          ? 'Moderate crowds. You should be able to enter without much delay.'
          : 'Low crowds. Great time to enter!',
  };
}

/**
 * Gets transportation options from a given area, with lower-carbon options first.
 *
 * @param originArea - The zone/area to get transport from
 * @returns Sorted transport options with sustainability info
 */
export function getTransportOptions(originArea: string): Record<string, unknown> {
  const zone = originArea.trim().toLowerCase();

  // Get options for the requested zone, then all others
  const zoneOptions = transit.filter((t) => t.zone === zone);
  const otherOptions = transit.filter((t) => t.zone !== zone);

  const allOptions = [...zoneOptions, ...otherOptions];

  // Sort by carbon label: zero first, then low, then medium
  const carbonOrder: Record<string, number> = { zero: 0, low: 1, medium: 2, high: 3 };
  allOptions.sort(
    (a, b) => (carbonOrder[a.carbonLabel] ?? 3) - (carbonOrder[b.carbonLabel] ?? 3)
  );

  return {
    origin: zone || 'general',
    options: allOptions.map((t) => ({
      type: t.type,
      name: t.name,
      schedule: t.schedule,
      nearestGate: `Gate ${t.nearestGate}`,
      walkToGateMinutes: t.walkToGateMinutes,
      accessible: t.accessible,
      carbonLabel: t.carbonLabel,
      sustainabilityNote:
        t.carbonLabel === 'zero'
          ? '🌱 Zero carbon — best for the planet!'
          : t.carbonLabel === 'low'
            ? '🌿 Low carbon — great sustainable choice'
            : '🚗 Higher carbon — consider greener alternatives',
    })),
  };
}

/**
 * Finds amenities of a specific type near a zone.
 *
 * @param type - The amenity type to search for
 * @param nearZone - Optional zone to prioritize results near
 * @param accessibilityMode - Whether to filter for accessible amenities only
 * @returns Matching amenities sorted by proximity to the requested zone
 */
export function getAmenity(
  type: string,
  nearZone?: string,
  accessibilityMode = false
): Record<string, unknown> {
  const typeNorm = type.trim().toLowerCase();
  const zoneNorm = nearZone?.trim().toLowerCase();

  let filtered = amenities.filter((a) => a.type === typeNorm);

  if (accessibilityMode) {
    filtered = filtered.filter((a) => a.accessible);
  }

  if (filtered.length === 0) {
    return {
      error: true,
      message: `No ${typeNorm} amenities found${accessibilityMode ? ' that are accessible' : ''}. Valid types: restroom, first_aid, prayer_room, family_room, water_refill, sustainability_station.`,
    };
  }

  // Sort: same zone first, then others
  if (zoneNorm) {
    filtered.sort((a, b) => {
      if (a.zone === zoneNorm && b.zone !== zoneNorm) return -1;
      if (a.zone !== zoneNorm && b.zone === zoneNorm) return 1;
      return 0;
    });
  }

  return {
    type: typeNorm,
    nearZone: zoneNorm ?? 'any',
    results: filtered.map((a) => ({
      name: a.name,
      zone: a.zone,
      level: a.level,
      accessible: a.accessible,
      ...(a.familyFriendly ? { familyFriendly: true } : {}),
      ...(a.sustainability ? { sustainability: true, note: '🌱 Sustainability feature' } : {}),
      ...(a.features ? { features: a.features } : {}),
    })),
  };
}

/**
 * Translates common fan phrases between supported languages.
 *
 * @param phrase - The phrase to translate
 * @param targetLang - The target language code
 * @returns The translation result
 */
export function translateQuickPhrase(
  phrase: string,
  targetLang: string
): Record<string, unknown> {
  const lang = targetLang.trim().toLowerCase() as Locale;

  if (!translations[lang]) {
    return {
      error: true,
      message: `Language "${targetLang}" is not supported. Supported: en, es, fr, ar.`,
    };
  }

  const targetPhrases = translations[lang].phrases;
  const phraseLower = phrase.trim().toLowerCase();

  // Search across all languages for the phrase
  for (const [locale, dict] of Object.entries(translations)) {
    for (const [originalPhrase, englishEquivalent] of Object.entries(dict.phrases)) {
      if (originalPhrase.toLowerCase() === phraseLower || englishEquivalent.toLowerCase() === phraseLower) {
        // Find the matching phrase in the target language
        for (const [targetPhrase, targetEnglish] of Object.entries(targetPhrases)) {
          if (targetEnglish === englishEquivalent) {
            return {
              originalPhrase: phrase,
              sourceLanguage: locale,
              translatedPhrase: targetPhrase,
              targetLanguage: lang,
              meaning: englishEquivalent,
            };
          }
        }
      }
    }
  }

  return {
    originalPhrase: phrase,
    targetLanguage: lang,
    note: 'This phrase is not in our common phrases dictionary. For full translation, please ask a multilingual stadium volunteer.',
  };
}

/* ------------------------------------------------------------------ */
/*  Tool executor                                                      */
/* ------------------------------------------------------------------ */

/**
 * Executes a tool call and returns the result.
 * This is the central dispatcher for all tool invocations.
 *
 * @param toolCall - The tool call to execute
 * @param accessibilityMode - Whether accessibility mode is enabled
 * @returns The tool execution result
 */
export function executeTool(
  toolCall: ToolCall,
  accessibilityMode = false
): ToolResult {
  const { name, args } = toolCall;

  let result: unknown;

  switch (name) {
    case 'findGate':
      result = findGate(args.section ?? '', accessibilityMode);
      break;
    case 'getAccessibleRoute':
      result = getAccessibleRoute(args.from ?? '', args.to ?? '');
      break;
    case 'getCrowdStatus':
      result = getCrowdStatus(args.gateOrZone ?? '');
      break;
    case 'getTransportOptions':
      result = getTransportOptions(args.originArea ?? '');
      break;
    case 'getAmenity':
      result = getAmenity(args.type ?? '', args.nearZone, accessibilityMode);
      break;
    case 'translateQuickPhrase':
      result = translateQuickPhrase(args.phrase ?? '', args.targetLang ?? 'en');
      break;
    default:
      result = { error: true, message: `Unknown tool: ${name}` };
  }

  return { toolName: name, result };
}
