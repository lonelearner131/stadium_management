/**
 * Main chat page — the fan-facing Stadium Companion AI assistant.
 * This is the primary user interface of the application.
 *
 * @module app/page
 */

'use client';


import { ChatWindow } from '@/components/ChatWindow';
import { Header } from '@/components/Header';
import { getTranslations } from '@/lib/i18n';



import { usePreferences } from '@/hooks/usePreferences';

/**
 * The main page component — renders the complete chat interface
 * with header controls for language and accessibility.
 */
export default function HomePage() {
  const {
    locale,
    theme,
    sessionContext,
    handleLocaleChange,
    handleAccessibilityToggle,
    handleThemeToggle,
    handleContextUpdate,
  } = usePreferences();
  const t = getTranslations(locale);

  return (
    <>
      <a href="#chat-input" className="skip-link">
        Skip to chat input
      </a>
      <div className="app-container">
        <Header
          title={t.ui.title}
          subtitle={t.ui.subtitle}
          locale={locale}
          accessibilityMode={sessionContext.accessibilityMode}
          theme={theme}
          onLocaleChange={handleLocaleChange}
          onAccessibilityToggle={handleAccessibilityToggle}
          onThemeToggle={handleThemeToggle}
          t={t}
        />

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
