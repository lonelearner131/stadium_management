/**
 * WelcomeScreen component
 *
 * @module components/WelcomeScreen
 */

import type { TranslationDictionary } from '@/lib/i18n';

interface WelcomeScreenProps {
  t: TranslationDictionary;
}

export function WelcomeScreen({ t }: WelcomeScreenProps) {
  return (
    <div className="welcome-screen">
      <div className="welcome-icon" aria-hidden="true">
        ⚽
      </div>
      <h2>{t.ui.title}</h2>
      <p>{t.ui.welcomeMessage}</p>
    </div>
  );
}
