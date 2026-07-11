/**
 * Hook to manage user preferences like language, theme, and accessibility.
 *
 * @module hooks/usePreferences
 */

import { useState, useCallback, useEffect } from 'react';
import type { Locale } from '@/lib/i18n';
import { getTextDirection } from '@/lib/i18n';

interface SessionContextState {
  sessionId: string;
  language: string;
  accessibilityMode: boolean;
  currentZone?: string;
  ticketSection?: string;
  hasAskedAboutAccessibility: boolean;
}

function generateSessionId(): string {
  return `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function getInitialTheme(): 'light' | 'dark' {
  if (typeof window !== 'undefined') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'dark';
}

function getInitialContext(): SessionContextState {
  return {
    sessionId: typeof window !== 'undefined' ? generateSessionId() : '',
    language: 'en',
    accessibilityMode: false,
    hasAskedAboutAccessibility: false,
  };
}

export function usePreferences() {
  const [locale, setLocale] = useState<Locale>('en');
  const [theme, setTheme] = useState<'light' | 'dark'>(getInitialTheme);
  const [sessionContext, setSessionContext] = useState<SessionContextState>(getInitialContext);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute('dir', getTextDirection(locale));
    document.documentElement.setAttribute('lang', locale);
  }, [locale]);

  const handleLocaleChange = useCallback((newLocale: Locale) => {
    setLocale(newLocale);
    setSessionContext((prev) => ({ ...prev, language: newLocale }));
  }, []);

  const handleAccessibilityToggle = useCallback((enabled: boolean) => {
    setSessionContext((prev) => ({ ...prev, accessibilityMode: enabled }));
  }, []);

  const handleThemeToggle = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const handleContextUpdate = useCallback((updates: Partial<SessionContextState>) => {
    setSessionContext((prev) => ({ ...prev, ...updates }));
  }, []);

  return {
    locale,
    theme,
    sessionContext,
    handleLocaleChange,
    handleAccessibilityToggle,
    handleThemeToggle,
    handleContextUpdate,
  };
}
