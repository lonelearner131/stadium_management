/**
 * Internationalization dictionaries for the Stadium Companion AI.
 * Supports: English (en), Spanish (es), French (fr), Arabic (ar).
 *
 * @module i18n
 */

/** Supported locale codes */
export type Locale = 'en' | 'es' | 'fr' | 'ar';

/** The structure of a translation dictionary */
export interface TranslationDictionary {
  /** UI element labels */
  ui: {
    title: string;
    subtitle: string;
    inputPlaceholder: string;
    sendButton: string;
    languageLabel: string;
    accessibilityToggle: string;
    accessibilityOn: string;
    accessibilityOff: string;
    darkMode: string;
    lightMode: string;
    voiceInput: string;
    voiceInputUnsupported: string;
    clearChat: string;
    typingIndicator: string;
    welcomeMessage: string;
    errorMessage: string;
    rateLimitMessage: string;
  };
  /** Quick action chip labels */
  quickActions: {
    findMyGate: string;
    crowdStatus: string;
    accessibleRoute: string;
    findRestroom: string;
    transportation: string;
    sustainability: string;
  };
  /** Common fan phrases for the translateQuickPhrase tool */
  phrases: Record<string, string>;
  /** Accessibility-related labels */
  a11y: {
    chatRegion: string;
    messageFrom: string;
    messageTo: string;
    newMessage: string;
    sendMessage: string;
    menuButton: string;
    closeMenu: string;
    loading: string;
  };
}

/** All translation dictionaries indexed by locale */
export const translations: Record<Locale, TranslationDictionary> = {
  en: {
    ui: {
      title: 'Stadium Companion AI',
      subtitle: 'Your FIFA World Cup 2026 Assistant',
      inputPlaceholder: 'Ask me about gates, routes, amenities...',
      sendButton: 'Send',
      languageLabel: 'Language',
      accessibilityToggle: 'Accessibility Mode',
      accessibilityOn: 'Accessibility mode enabled',
      accessibilityOff: 'Accessibility mode disabled',
      darkMode: 'Dark mode',
      lightMode: 'Light mode',
      voiceInput: 'Voice input',
      voiceInputUnsupported: 'Voice input is not supported in your browser',
      clearChat: 'Clear chat',
      typingIndicator: 'Assistant is typing...',
      welcomeMessage:
        'Welcome to MetLife Stadium! I\'m your AI assistant for FIFA World Cup 2026. I can help you find your gate, accessible routes, nearby amenities, transportation options, and more. How can I help you today?',
      errorMessage: 'Sorry, something went wrong. Please try again.',
      rateLimitMessage: 'You\'re sending messages too quickly. Please wait a moment.',
    },
    quickActions: {
      findMyGate: '🚪 Find my gate',
      crowdStatus: '👥 Crowd status',
      accessibleRoute: '♿ Accessible route',
      findRestroom: '🚻 Find restroom',
      transportation: '🚌 Transportation',
      sustainability: '🌱 Sustainability',
    },
    phrases: {
      'Where is my seat?': 'Where is my seat?',
      'Goal!': 'Goal!',
      'Excuse me': 'Excuse me',
      'Thank you': 'Thank you',
      'Where is the restroom?': 'Where is the restroom?',
      'Help': 'Help',
      'Water please': 'Water please',
      'What is the score?': 'What is the score?',
    },
    a11y: {
      chatRegion: 'Chat with Stadium Assistant',
      messageFrom: 'Message from you',
      messageTo: 'Message from assistant',
      newMessage: 'New message from assistant',
      sendMessage: 'Send message',
      menuButton: 'Open settings menu',
      closeMenu: 'Close settings menu',
      loading: 'Loading response',
    },
  },

  es: {
    ui: {
      title: 'Asistente del Estadio IA',
      subtitle: 'Tu Asistente para la Copa Mundial FIFA 2026',
      inputPlaceholder: 'Pregúntame sobre puertas, rutas, servicios...',
      sendButton: 'Enviar',
      languageLabel: 'Idioma',
      accessibilityToggle: 'Modo de accesibilidad',
      accessibilityOn: 'Modo de accesibilidad activado',
      accessibilityOff: 'Modo de accesibilidad desactivado',
      darkMode: 'Modo oscuro',
      lightMode: 'Modo claro',
      voiceInput: 'Entrada de voz',
      voiceInputUnsupported: 'La entrada de voz no está disponible en tu navegador',
      clearChat: 'Limpiar chat',
      typingIndicator: 'El asistente está escribiendo...',
      welcomeMessage:
        '¡Bienvenido al MetLife Stadium! Soy tu asistente de IA para la Copa Mundial FIFA 2026. Puedo ayudarte a encontrar tu puerta, rutas accesibles, servicios cercanos, opciones de transporte y más. ¿Cómo puedo ayudarte hoy?',
      errorMessage: 'Lo siento, algo salió mal. Por favor, inténtalo de nuevo.',
      rateLimitMessage: 'Estás enviando mensajes demasiado rápido. Espera un momento.',
    },
    quickActions: {
      findMyGate: '🚪 Encontrar mi puerta',
      crowdStatus: '👥 Estado de multitudes',
      accessibleRoute: '♿ Ruta accesible',
      findRestroom: '🚻 Encontrar baños',
      transportation: '🚌 Transporte',
      sustainability: '🌱 Sostenibilidad',
    },
    phrases: {
      '¿Dónde está mi asiento?': 'Where is my seat?',
      '¡Gol!': 'Goal!',
      'Disculpe': 'Excuse me',
      'Gracias': 'Thank you',
      '¿Dónde está el baño?': 'Where is the restroom?',
      'Ayuda': 'Help',
      'Agua por favor': 'Water please',
      '¿Cuál es el marcador?': 'What is the score?',
    },
    a11y: {
      chatRegion: 'Chat con el Asistente del Estadio',
      messageFrom: 'Mensaje de ti',
      messageTo: 'Mensaje del asistente',
      newMessage: 'Nuevo mensaje del asistente',
      sendMessage: 'Enviar mensaje',
      menuButton: 'Abrir menú de configuración',
      closeMenu: 'Cerrar menú de configuración',
      loading: 'Cargando respuesta',
    },
  },

  fr: {
    ui: {
      title: 'Assistant Stade IA',
      subtitle: 'Votre Assistant pour la Coupe du Monde FIFA 2026',
      inputPlaceholder: 'Posez-moi des questions sur les portes, itinéraires...',
      sendButton: 'Envoyer',
      languageLabel: 'Langue',
      accessibilityToggle: "Mode d'accessibilité",
      accessibilityOn: "Mode d'accessibilité activé",
      accessibilityOff: "Mode d'accessibilité désactivé",
      darkMode: 'Mode sombre',
      lightMode: 'Mode clair',
      voiceInput: 'Saisie vocale',
      voiceInputUnsupported: "La saisie vocale n'est pas disponible dans votre navigateur",
      clearChat: 'Effacer le chat',
      typingIndicator: "L'assistant est en train d'écrire...",
      welcomeMessage:
        "Bienvenue au MetLife Stadium ! Je suis votre assistant IA pour la Coupe du Monde FIFA 2026. Je peux vous aider à trouver votre porte, des itinéraires accessibles, des commodités proches, des options de transport et plus encore. Comment puis-je vous aider aujourd'hui ?",
      errorMessage: "Désolé, quelque chose s'est mal passé. Veuillez réessayer.",
      rateLimitMessage: 'Vous envoyez des messages trop rapidement. Veuillez patienter.',
    },
    quickActions: {
      findMyGate: '🚪 Trouver ma porte',
      crowdStatus: '👥 État de la foule',
      accessibleRoute: '♿ Itinéraire accessible',
      findRestroom: '🚻 Trouver toilettes',
      transportation: '🚌 Transport',
      sustainability: '🌱 Durabilité',
    },
    phrases: {
      'Où est ma place ?': 'Where is my seat?',
      'But !': 'Goal!',
      'Excusez-moi': 'Excuse me',
      'Merci': 'Thank you',
      'Où sont les toilettes ?': 'Where is the restroom?',
      'Au secours': 'Help',
      "De l'eau s'il vous plaît": 'Water please',
      'Quel est le score ?': 'What is the score?',
    },
    a11y: {
      chatRegion: "Chat avec l'Assistant du Stade",
      messageFrom: 'Message de vous',
      messageTo: "Message de l'assistant",
      newMessage: "Nouveau message de l'assistant",
      sendMessage: 'Envoyer le message',
      menuButton: 'Ouvrir le menu des paramètres',
      closeMenu: 'Fermer le menu des paramètres',
      loading: 'Chargement de la réponse',
    },
  },

  ar: {
    ui: {
      title: 'مساعد الملعب الذكي',
      subtitle: 'مساعدك لكأس العالم فيفا 2026',
      inputPlaceholder: 'اسألني عن البوابات والمسارات والخدمات...',
      sendButton: 'إرسال',
      languageLabel: 'اللغة',
      accessibilityToggle: 'وضع إمكانية الوصول',
      accessibilityOn: 'تم تفعيل وضع إمكانية الوصول',
      accessibilityOff: 'تم إيقاف وضع إمكانية الوصول',
      darkMode: 'الوضع الداكن',
      lightMode: 'الوضع الفاتح',
      voiceInput: 'الإدخال الصوتي',
      voiceInputUnsupported: 'الإدخال الصوتي غير متاح في متصفحك',
      clearChat: 'مسح المحادثة',
      typingIndicator: 'المساعد يكتب...',
      welcomeMessage:
        'مرحباً بك في ملعب ميتلايف! أنا مساعدك الذكي لكأس العالم فيفا 2026. يمكنني مساعدتك في إيجاد بوابتك، المسارات المتاحة، المرافق القريبة، خيارات النقل والمزيد. كيف يمكنني مساعدتك اليوم؟',
      errorMessage: 'عذراً، حدث خطأ ما. يرجى المحاولة مرة أخرى.',
      rateLimitMessage: 'أنت ترسل رسائل بسرعة كبيرة. يرجى الانتظار لحظة.',
    },
    quickActions: {
      findMyGate: '🚪 ابحث عن بوابتي',
      crowdStatus: '👥 حالة الازدحام',
      accessibleRoute: '♿ مسار متاح',
      findRestroom: '🚻 ابحث عن دورة المياه',
      transportation: '🚌 المواصلات',
      sustainability: '🌱 الاستدامة',
    },
    phrases: {
      'أين مقعدي؟': 'Where is my seat?',
      'هدف!': 'Goal!',
      'عفواً': 'Excuse me',
      'شكراً': 'Thank you',
      'أين دورة المياه؟': 'Where is the restroom?',
      'مساعدة': 'Help',
      'ماء من فضلك': 'Water please',
      'ما هي النتيجة؟': 'What is the score?',
    },
    a11y: {
      chatRegion: 'محادثة مع مساعد الملعب',
      messageFrom: 'رسالة منك',
      messageTo: 'رسالة من المساعد',
      newMessage: 'رسالة جديدة من المساعد',
      sendMessage: 'إرسال الرسالة',
      menuButton: 'فتح قائمة الإعدادات',
      closeMenu: 'إغلاق قائمة الإعدادات',
      loading: 'جارٍ تحميل الرد',
    },
  },
};

/**
 * Returns the translation dictionary for the given locale.
 * Falls back to English if the locale is not supported.
 *
 * @param locale - The locale code
 * @returns The translation dictionary
 */
export function getTranslations(locale: string): TranslationDictionary {
  if (locale in translations) {
    return translations[locale as Locale];
  }
  return translations.en;
}

/**
 * All supported locales with their display names.
 */
export const SUPPORTED_LOCALES: { code: Locale; name: string; dir: 'ltr' | 'rtl' }[] = [
  { code: 'en', name: 'English', dir: 'ltr' },
  { code: 'es', name: 'Español', dir: 'ltr' },
  { code: 'fr', name: 'Français', dir: 'ltr' },
  { code: 'ar', name: 'العربية', dir: 'rtl' },
];

/**
 * Gets the text direction for a given locale.
 *
 * @param locale - The locale code
 * @returns 'rtl' for right-to-left languages, 'ltr' otherwise
 */
export function getTextDirection(locale: string): 'ltr' | 'rtl' {
  const found = SUPPORTED_LOCALES.find((l) => l.code === locale);
  return found?.dir ?? 'ltr';
}
