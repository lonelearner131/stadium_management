/**
 * CrowdBadge component — displays crowd density level
 * with color-coded indicators.
 *
 * @module components/CrowdBadge
 */

'use client';

import { memo } from 'react';
import type { CrowdDensity } from '@/lib/data/crowd-simulation';

interface CrowdBadgeProps {
  /** The crowd density level */
  density: CrowdDensity;
  /** The location name */
  location: string;
}

const DENSITY_LABELS: Record<CrowdDensity, string> = {
  low: '🟢 Low',
  medium: '🟡 Medium',
  high: '🔴 High',
};

/**
 * A color-coded badge showing crowd density for a location.
 */
function CrowdBadgeInner({ density, location }: CrowdBadgeProps) {
  return (
    <span
      className={`crowd-badge ${density}`}
      role="status"
      aria-label={`${location}: ${density} crowd density`}
    >
      {DENSITY_LABELS[density]}
    </span>
  );
}

export const CrowdBadge = memo(CrowdBadgeInner);
CrowdBadge.displayName = 'CrowdBadge';
