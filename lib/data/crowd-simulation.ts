/**
 * Deterministic pseudo-live crowd density generator.
 * Uses time-seeded values to produce consistent density readings
 * without any external API calls.
 *
 * @module crowd-simulation
 */

/** Crowd density levels used throughout the app */
export type CrowdDensity = 'low' | 'medium' | 'high';

/** Result of a crowd status query */
export interface CrowdStatus {
  /** The gate or zone queried */
  location: string;
  /** Current simulated density level */
  density: CrowdDensity;
  /** Estimated wait time in minutes */
  estimatedWaitMinutes: number;
  /** Percentage fullness (0–100) */
  percentage: number;
  /** If density is high, a less-crowded alternative */
  alternateRecommendation: string | null;
  /** ISO timestamp of the simulated reading */
  timestamp: string;
}

/**
 * Simple seedable pseudo-random number generator (mulberry32).
 * Produces deterministic sequences from any numeric seed.
 *
 * @param seed - The seed value
 * @returns A function that returns the next pseudo-random number in [0, 1)
 */
function mulberry32(seed: number): () => number {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** All valid zones in the stadium */
const ZONES = ['north', 'east', 'south', 'west'] as const;

/** Gate IDs matching the venue data */
const GATES = ['A', 'B', 'C', 'D'] as const;

/** Maps zones to their primary gate */
const ZONE_TO_GATE: Record<string, string> = {
  north: 'A',
  east: 'B',
  south: 'C',
  west: 'D',
};

/** Maps gates to their zone */
const GATE_TO_ZONE: Record<string, string> = {
  A: 'north',
  B: 'east',
  C: 'south',
  D: 'west',
};

/**
 * Generates a time-based seed that changes every 5 minutes.
 * This creates the illusion of live updating data while remaining
 * deterministic for the same 5-minute window.
 *
 * @param locationKey - The location identifier to make each location unique
 * @param timestamp - Optional timestamp override for testing
 * @returns A numeric seed
 */
function getTimeSeed(locationKey: string, timestamp?: Date): number {
  const now = timestamp ?? new Date();
  const fiveMinBlock = Math.floor(now.getTime() / (5 * 60 * 1000));
  let hash = fiveMinBlock;
  for (let i = 0; i < locationKey.length; i++) {
    hash = ((hash << 5) - hash + locationKey.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/**
 * Converts a raw percentage to a density level.
 *
 * @param percentage - Percentage fullness (0–100)
 * @returns The corresponding density level
 */
function percentageToDensity(percentage: number): CrowdDensity {
  if (percentage < 40) return 'low';
  if (percentage < 70) return 'medium';
  return 'high';
}

/**
 * Finds a less-crowded alternative gate/zone when density is high.
 *
 * @param currentLocation - The current gate or zone
 * @param allStatuses - Map of all locations to their percentages
 * @returns The recommended alternative location, or null if none is better
 */
function findAlternate(
  currentLocation: string,
  allStatuses: Map<string, number>
): string | null {
  let bestLocation: string | null = null;
  let bestPercentage = 100;

  for (const [loc, pct] of allStatuses) {
    if (loc === currentLocation) continue;
    if (pct < bestPercentage) {
      bestPercentage = pct;
      bestLocation = loc;
    }
  }

  return bestLocation && bestPercentage < 70 ? `Gate ${bestLocation}` : null;
}

/**
 * Gets the crowd status for a specific gate or zone.
 * Produces deterministic results for the same 5-minute time window.
 *
 * @param gateOrZone - Gate letter (A–D) or zone name (north/east/south/west)
 * @param timestamp - Optional timestamp override for testing
 * @returns The simulated crowd status
 */
export function getCrowdStatusForLocation(
  gateOrZone: string,
  timestamp?: Date
): CrowdStatus {
  const normalized = gateOrZone.trim().toUpperCase();
  const normalizedLower = gateOrZone.trim().toLowerCase();

  // Resolve to gate ID
  let gateId: string;
  if (GATES.includes(normalized as (typeof GATES)[number])) {
    gateId = normalized;
  } else if (ZONES.includes(normalizedLower as (typeof ZONES)[number])) {
    gateId = ZONE_TO_GATE[normalizedLower] ?? 'A';
  } else {
    gateId = 'A'; // Default fallback
  }

  // Generate all zone percentages for alternate recommendations
  const allPercentages = new Map<string, number>();
  for (const gate of GATES) {
    const seed = getTimeSeed(gate, timestamp);
    const rng = mulberry32(seed);
    const pct = Math.floor(rng() * 100);
    allPercentages.set(gate, pct);
  }

  const percentage = allPercentages.get(gateId) ?? 50;
  const density = percentageToDensity(percentage);
  const waitMinutes =
    density === 'low' ? Math.floor(percentage / 10) : density === 'medium' ? Math.floor(percentage / 5) : Math.floor(percentage / 3);

  const alternate = density === 'high' ? findAlternate(gateId, allPercentages) : null;

  return {
    location: `Gate ${gateId} (${GATE_TO_ZONE[gateId]} zone)`,
    density,
    estimatedWaitMinutes: waitMinutes,
    percentage,
    alternateRecommendation: alternate,
    timestamp: (timestamp ?? new Date()).toISOString(),
  };
}

/**
 * Gets crowd status for all gates/zones at once.
 * Useful for dashboard displays.
 *
 * @param timestamp - Optional timestamp override for testing
 * @returns Array of crowd status for all gates
 */
export function getAllCrowdStatuses(timestamp?: Date): CrowdStatus[] {
  return GATES.map((gate) => getCrowdStatusForLocation(gate, timestamp));
}
