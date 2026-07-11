/**
 * LanguageSwitcher component — dropdown selector for supported languages.
 *
 * @module components/LanguageSwitcher
 */

'use client';

import { memo, useCallback, type ChangeEvent } from 'react';
import { SUPPORTED_LOCALES, type Locale } from '@/lib/i18n';

interface LanguageSwitcherProps {
  /** Currently selected locale */
  currentLocale: Locale;
  /** Callback when locale changes */
  onLocaleChange: (locale: Locale) => void;
  /** Accessible label */
  label: string;
}

/**
 * Language selector dropdown with flag labels.
 */
function LanguageSwitcherInner({
  currentLocale,
  onLocaleChange,
  label,
}: LanguageSwitcherProps) {
  const handleChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      onLocaleChange(e.target.value as Locale);
    },
    [onLocaleChange]
  );

  return (
    <select
      className="language-select"
      value={currentLocale}
      onChange={handleChange}
      aria-label={label}
      id="language-selector"
    >
      {SUPPORTED_LOCALES.map((locale) => (
        <option key={locale.code} value={locale.code}>
          {locale.name}
        </option>
      ))}
    </select>
  );
}

export const LanguageSwitcher = memo(LanguageSwitcherInner);
LanguageSwitcher.displayName = 'LanguageSwitcher';
