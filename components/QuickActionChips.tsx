/**
 * QuickActionChips component — renders contextual action buttons
 * that let users quickly ask common questions.
 *
 * @module components/QuickActionChips
 */

'use client';

import React, { memo } from 'react';
import type { TranslationDictionary } from '@/lib/i18n';

interface QuickActionChipsProps {
  /** Translation dictionary for localized labels */
  translations: TranslationDictionary;
  /** Callback when a chip is clicked */
  onChipClick: (message: string) => void;
  /** Whether chips should be disabled */
  disabled: boolean;
}

/** Maps quick action keys to the message sent on click */
const CHIP_MESSAGES: Record<string, string> = {
  findMyGate: 'Help me find my gate',
  crowdStatus: 'How busy are the gates right now?',
  accessibleRoute: 'I need an accessible route',
  findRestroom: 'Where is the nearest restroom?',
  transportation: 'What are my transportation options?',
  sustainability: 'Where can I find water refill stations?',
};

/**
 * A row of contextual quick-action chip buttons.
 */
function QuickActionChipsInner({
  translations: t,
  onChipClick,
  disabled,
}: QuickActionChipsProps) {
  const chips = React.useMemo(() => {
    return Object.entries(t.quickActions) as [string, string][];
  }, [t.quickActions]);

  return (
    <div className="quick-actions" role="toolbar" aria-label="Quick actions">
      {chips.map(([key, label]) => (
        <button
          key={key}
          className="quick-action-chip"
          onClick={() => onChipClick(CHIP_MESSAGES[key] ?? label)}
          disabled={disabled}
          type="button"
          aria-label={label}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export const QuickActionChips = memo(QuickActionChipsInner);
QuickActionChips.displayName = 'QuickActionChips';
