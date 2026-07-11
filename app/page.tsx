/**
 * Main chat page — the fan-facing Stadium Companion AI assistant.
 * This is the primary user interface of the application.
 *
 * @module app/page
 */

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { ChatWindow } from '@/components/ChatWindow';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { AccessibilityToggle } from '@/components/AccessibilityToggle';
import { getTranslations, getTextDirection, type Locale } from '@/lib/i18n';

/** Session context state */
interface SessionContextState {
  sessionId: string;
  language: string;
  accessibilityMode: boolean;
  currentZone?: string;
  ticketSection?: string;
  hasAskedAboutAccessibility: boolean;
}

/**
 * Generates a random session ID (non-identifying).
 *
 * @returns A random alphanumeric session ID
 */
function generateSessionId(): string {
  return `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * The main page component — renders the complete chat interface
 * with header controls for language and accessibility.
 */
export default function HomePage() {
  const [locale, setLocale] = useState<Locale>('en');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [sessionContext, setSessionContext] = useState<SessionContextState>({
    sessionId: '',
    language: 'en',
    accessibilityMode: false,
    hasAskedAboutAccessibility: false,
  });

  // Initialize session ID and detect system theme on mount
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSessionContext((prev) => ({
      ...prev,
      sessionId: generateSessionId(),
    }));

    // Detect system preference
    if (typeof window !== 'undefined') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
    }
  }, []);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Apply text direction
  useEffect(() => {
    document.documentElement.setAttribute('dir', getTextDirection(locale));
    document.documentElement.setAttribute('lang', locale);
  }, [locale]);

  const t = getTranslations(locale);

  /** Handle locale change */
  const handleLocaleChange = useCallback((newLocale: Locale) => {
    setLocale(newLocale);
    setSessionContext((prev) => ({ ...prev, language: newLocale }));
  }, []);

  /** Handle accessibility mode toggle */
  const handleAccessibilityToggle = useCallback((enabled: boolean) => {
    setSessionContext((prev) => ({ ...prev, accessibilityMode: enabled }));
  }, []);

  /** Handle theme toggle */
  const handleThemeToggle = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  /** Handle session context updates from chat */
  const handleContextUpdate = useCallback(
    (updates: Partial<SessionContextState>) => {
      setSessionContext((prev) => ({ ...prev, ...updates }));
    },
    []
  );

  return (
    <>
      <a href="#chat-input" className="skip-link">
        Skip to chat input
      </a>
      <div className="app-container">
        <header className="app-header" role="banner">
          <div className="header-brand">
            <div className="header-logo" aria-hidden="true">
              ⚽
            </div>
            <div className="header-text">
              <h1>{t.ui.title}</h1>
              <p>{t.ui.subtitle}</p>
            </div>
          </div>
          <nav className="header-actions" aria-label="Settings">
            <LanguageSwitcher
              currentLocale={locale}
              onLocaleChange={handleLocaleChange}
              label={t.ui.languageLabel}
            />
            <AccessibilityToggle
              isEnabled={sessionContext.accessibilityMode}
              onToggle={handleAccessibilityToggle}
              labelOn={t.ui.accessibilityOn}
              labelOff={t.ui.accessibilityOff}
            />
            <button
              className="icon-btn"
              onClick={handleThemeToggle}
              aria-label={theme === 'dark' ? t.ui.lightMode : t.ui.darkMode}
              title={theme === 'dark' ? t.ui.lightMode : t.ui.darkMode}
              type="button"
              id="theme-toggle"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          </nav>
        </header>

        <main>
          <ChatWindow
            translations={t}
            sessionContext={sessionContext}
            onContextUpdate={handleContextUpdate}
          />
        </main>
      </div>
    </>
  );
}
