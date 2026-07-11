/**
 * AccessibilityToggle component — button to enable/disable
 * accessibility mode (step-free routing, companion seats, etc.).
 *
 * @module components/AccessibilityToggle
 */

'use client';

import { memo, useCallback } from 'react';

interface AccessibilityToggleProps {
  /** Whether accessibility mode is currently on */
  isEnabled: boolean;
  /** Callback to toggle the mode */
  onToggle: (enabled: boolean) => void;
  /** Label when enabled */
  labelOn: string;
  /** Label when disabled */
  labelOff: string;
}

/**
 * A toggle button for accessibility mode.
 */
function AccessibilityToggleInner({
  isEnabled,
  onToggle,
  labelOn,
  labelOff,
}: AccessibilityToggleProps) {
  const handleClick = useCallback(() => {
    onToggle(!isEnabled);
  }, [isEnabled, onToggle]);

  return (
    <button
      className={`icon-btn ${isEnabled ? 'active' : ''}`}
      onClick={handleClick}
      aria-pressed={isEnabled}
      aria-label={isEnabled ? labelOn : labelOff}
      title={isEnabled ? labelOn : labelOff}
      type="button"
      id="accessibility-toggle"
    >
      ♿
    </button>
  );
}

export const AccessibilityToggle = memo(AccessibilityToggleInner);
AccessibilityToggle.displayName = 'AccessibilityToggle';
