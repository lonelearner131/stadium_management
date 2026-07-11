/**
 * Header component for the main chat interface
 *
 * @module components/Header
 */

import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { AccessibilityToggle } from '@/components/AccessibilityToggle';
import type { TranslationDictionary } from '@/lib/i18n';

interface HeaderProps {
  title: string;
  subtitle: string;
  locale: 'en' | 'es' | 'fr' | 'ar';
  accessibilityMode: boolean;
  theme: 'light' | 'dark';
  onLocaleChange: (locale: 'en' | 'es' | 'fr' | 'ar') => void;
  onAccessibilityToggle: (enabled: boolean) => void;
  onThemeToggle: () => void;
  t: TranslationDictionary;
}

export function Header({
  title,
  subtitle,
  locale,
  accessibilityMode,
  theme,
  onLocaleChange,
  onAccessibilityToggle,
  onThemeToggle,
  t,
}: HeaderProps) {
  return (
    <header className="app-header" role="banner">
      <div className="header-brand">
        <div className="header-logo" aria-hidden="true">
          ⚽
        </div>
        <div className="header-text">
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
      </div>
      <nav className="header-actions" aria-label="Settings">
        <LanguageSwitcher
          currentLocale={locale}
          onLocaleChange={onLocaleChange}
          label={t.ui.languageLabel}
        />
        <AccessibilityToggle
          isEnabled={accessibilityMode}
          onToggle={onAccessibilityToggle}
          labelOn={t.ui.accessibilityOn}
          labelOff={t.ui.accessibilityOff}
        />
        <button
          className="icon-btn"
          onClick={onThemeToggle}
          aria-label={theme === 'dark' ? t.ui.lightMode : t.ui.darkMode}
          title={theme === 'dark' ? t.ui.lightMode : t.ui.darkMode}
          type="button"
          id="theme-toggle"
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </nav>
    </header>
  );
}
