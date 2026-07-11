/**
 * Deterministic rule-based AI provider — used automatically when:
 * - No GEMINI_API_KEY is set
 * - The Gemini API errors or hits rate limits
 *
 * This makes the app fully functional offline/keyless by pattern-matching
 * user messages and invoking the same tools the Gemini provider would.
 *
 * @module ai/fallback-provider
 */

import type { AIProvider, GenerateOptions, StreamChunk, ToolCall } from '@/lib/ai/provider';
import { executeTool } from '@/lib/ai/tools';
import { getTranslations, type TranslationDictionary } from '@/lib/i18n';

/** Pattern-matched intent with associated tool call */
interface Intent {
  pattern: RegExp;
  toolCall: (match: RegExpMatchArray, message: string) => ToolCall | null;
  fallbackResponse: (match: RegExpMatchArray, message: string) => string;
}

/**
 * Extracts a section number from a message string.
 *
 * @param message - The user message
 * @returns The section number string or undefined
 */
function extractSection(message: string): string | undefined {
  const match = message.match(/section\s*(\d{3})/i) ?? message.match(/\b(1[0-3]\d)\b/);
  return match?.[1];
}

/**
 * Extracts a zone name from a message string.
 *
 * @param message - The user message
 * @returns The zone name or 'north' as default
 */
function extractZone(message: string): string {
  const zoneMatch = message.match(/\b(north|east|south|west)\b/i);
  return zoneMatch?.[1]?.toLowerCase() ?? 'north';
}

/**
 * Extracts a gate letter from a message string.
 *
 * @param message - The user message
 * @returns The gate letter or undefined
 */
function extractGate(message: string): string | undefined {
  const match = message.match(/gate\s*([A-Da-d])/i);
  return match?.[1]?.toUpperCase();
}

/**
 * Intent patterns for matching user messages to tool calls.
 * Order matters — first match wins.
 */
const intents: Intent[] = [

  // Accessible route
  {
    pattern: /\b(accessible|wheelchair|ramp|elevator|step.?free|disability|mobility|lift)\b/i,
    toolCall: (_match, msg) => {
      const section = extractSection(msg);
      const gate = extractGate(msg);
      if (section && gate) {
        return { name: 'getAccessibleRoute', args: { from: `Gate ${gate}`, to: `Section ${section}` } };
      }
      if (section) {
        return { name: 'getAccessibleRoute', args: { from: 'Main Entrance', to: `Section ${section}` } };
      }
      return null;
    },
    fallbackResponse: () =>
      'I can find you an accessible, step-free route! Please tell me where you\'re starting from and where you\'d like to go. For example, "accessible route from Gate A to Section 113".',
  },

  // Crowd status
  {
    pattern: /\b(crowd|busy|wait|queue|line|packed|full|density|how busy|crowded)\b/i,
    toolCall: (_match, msg) => {
      const gate = extractGate(msg);
      const zone = extractZone(msg);
      return { name: 'getCrowdStatus', args: { gateOrZone: gate ?? zone } };
    },
    fallbackResponse: () => 'Let me check the crowd levels for you.',
  },

  // Transportation
  {
    pattern: /\b(transport|bus|train|shuttle|taxi|uber|lyft|ride|parking|car|drive|subway|metro|transit|get here|getting here|leave|leaving|bicycle|bike)\b/i,
    toolCall: (_match, msg) => {
      const zone = extractZone(msg);
      return { name: 'getTransportOptions', args: { originArea: zone } };
    },
    fallbackResponse: () => 'Let me find transportation options for you.',
  },

  // Restroom
  {
    pattern: /\b(restroom|bathroom|toilet|wc|washroom|loo)\b/i,
    toolCall: (_match, msg) => {
      const zone = extractZone(msg);
      return { name: 'getAmenity', args: { type: 'restroom', nearZone: zone } };
    },
    fallbackResponse: () => 'Let me find the nearest restrooms for you.',
  },

  // Prayer room
  {
    pattern: /\b(prayer|pray|mosque|meditation|quiet room|worship)\b/i,
    toolCall: (_match, msg) => {
      const zone = extractZone(msg);
      return { name: 'getAmenity', args: { type: 'prayer_room', nearZone: zone } };
    },
    fallbackResponse: () => 'Let me find the nearest prayer and meditation room.',
  },

  // First aid
  {
    pattern: /\b(first aid|medical|nurse|doctor|hurt|injured|health|emergency)\b/i,
    toolCall: (_match, msg) => {
      const zone = extractZone(msg);
      return { name: 'getAmenity', args: { type: 'first_aid', nearZone: zone } };
    },
    fallbackResponse: () =>
      'For immediate emergencies, please contact the nearest staff member or call stadium security. Let me also find the nearest first aid station for you.',
  },

  // Family room
  {
    pattern: /\b(family|baby|child|kid|nursing|diaper|changing table|stroller)\b/i,
    toolCall: (_match, msg) => {
      const zone = extractZone(msg);
      return { name: 'getAmenity', args: { type: 'family_room', nearZone: zone } };
    },
    fallbackResponse: () => 'Let me find the nearest family room for you.',
  },

  // Water refill / sustainability
  {
    pattern: /\b(water|refill|bottle|drinking|fountain|sustainability|recycle|recycling|compost|green|eco|environment)\b/i,
    toolCall: (_match, msg) => {
      const zone = extractZone(msg);
      if (/\b(recycle|recycling|compost|sustainability station|eco|green)\b/i.test(msg)) {
        return { name: 'getAmenity', args: { type: 'sustainability_station', nearZone: zone } };
      }
      return { name: 'getAmenity', args: { type: 'water_refill', nearZone: zone } };
    },
    fallbackResponse: () => 'Let me find the nearest sustainability station for you.',
  },

  // Translation
  {
    pattern: /\b(translate|how do you say|how to say|in spanish|in french|in arabic|en español|en français|بالعربية)\b/i,
    toolCall: (_match, msg) => {
      let targetLang = 'es';
      if (/\b(french|français)\b/i.test(msg)) targetLang = 'fr';
      if (/\b(arabic|عربي)\b/i.test(msg)) targetLang = 'ar';
      if (/\b(english)\b/i.test(msg)) targetLang = 'en';
      if (/\b(spanish|español)\b/i.test(msg)) targetLang = 'es';

      // Try to extract the phrase to translate
      const phraseMatch = msg.match(/(?:translate|how (?:do you|to) say)\s*["""]?(.+?)["""]?\s*(?:in|to)\s/i);
      const phrase = phraseMatch?.[1] ?? 'Hello';

      return { name: 'translateQuickPhrase', args: { phrase, targetLang } };
    },
    fallbackResponse: () =>
      'I can translate common fan phrases! Try asking something like "How do you say Goal! in Spanish?"',
  },

  // Section / seat finding
  {
    pattern: /\b(section|seat|where.*sit|find.*seat|my seat)\b/i,
    toolCall: (_match, msg) => {
      const section = extractSection(msg);
      if (section) {
        return { name: 'findGate', args: { section } };
      }
      return null;
    },
    fallbackResponse: () =>
      'I can help you find your seat! What section number is on your ticket? For example, "Section 118".',
  },

  // Gate finding (moved to bottom as 'gate' is a common word)
  {
    pattern: /\b(gate|entrance|enter|find.*gate|which gate|my gate)\b/i,
    toolCall: (_match, msg) => {
      const section = extractSection(msg);
      if (section) {
        return { name: 'findGate', args: { section } };
      }
      return null;
    },
    fallbackResponse: () =>
      'I can help you find your gate! Could you tell me your section number? For example, "Section 101" or just the number like "125".',
  },
];

const formatters: Record<string, (result: Record<string, unknown>) => string> = {
  findGate: (res) => {
    const parts = [`Your nearest gate is **${res.gate}** (${res.zone} zone).`];
    parts.push(`Walk time: approximately **${res.walkTimeMinutes} minutes**.`);
    parts.push(`Nearest parking: ${res.nearestParking}.`);
    if (res.accessible !== undefined) {
      parts.push(res.hasRamp ? '♿ Ramp access available.' : '', res.hasElevator ? 'Elevator available.' : '');
      if (res.accessibleRoute) parts.push(`\nAccessible route: ${res.accessibleRoute}`);
      if (res.warning) {
        parts.push(`\n⚠️ ${res.warning}`);
        if (res.nearestAccessibleSection) parts.push(`Nearest accessible section: ${res.nearestAccessibleSection}`);
      }
    }
    return parts.filter(Boolean).join(' ');
  },
  getAccessibleRoute: (res) => {
    const parts = [
      `**Accessible Route** from ${res.from} to ${res.to}:`,
      String(res.description),
      `Estimated time: **${res.estimatedMinutes} minutes**.`,
      `Step-free: ${res.stepFree ? '✅ Yes' : '❌ No'}`,
    ];
    if (Array.isArray(res.landmarks) && res.landmarks.length > 0) {
      parts.push(`Landmarks: ${(res.landmarks as string[]).join(' → ')}`);
    }
    if (res.note) parts.push(`\n📝 ${res.note}`);
    return parts.join('\n');
  },
  getCrowdStatus: (res) => {
    const emoji = res.density === 'low' ? '🟢' : res.density === 'medium' ? '🟡' : '🔴';
    const parts = [
      `**${res.location}** — Crowd density: ${emoji} **${String(res.density).toUpperCase()}**`,
      `Estimated wait: ~${res.estimatedWaitMinutes} minutes.`,
      String(res.advice ?? ''),
    ];
    if (res.alternateRecommendation) parts.push(`💡 Recommended alternative: **${res.alternateRecommendation}**`);
    return parts.join('\n');
  },
  getTransportOptions: (res) => {
    const options = res.options as Array<Record<string, unknown>>;
    const parts = [`**Transportation options** (sorted by sustainability):\n`];
    for (const opt of options) {
      parts.push(`• **${opt.name}** (${opt.type})`, `  ${opt.sustainabilityNote}`, `  Schedule: ${opt.schedule}`, `  Nearest: ${opt.nearestGate} (~${opt.walkToGateMinutes} min walk)`, `  ${opt.accessible ? '♿ Accessible' : '⚠️ May not be fully accessible'}`, '');
    }
    return parts.join('\n');
  },
  getAmenity: (res) => {
    const results = res.results as Array<Record<string, unknown>>;
    const typeStr = String(res.type ?? 'amenity').replace(/_/g, ' ');
    const parts = [`**Nearest ${typeStr}${results.length > 1 ? 's' : ''}:**\n`];
    for (const r of results.slice(0, 3)) {
      const notes: string[] = [];
      if (r.accessible) notes.push('♿ Accessible');
      if (r.familyFriendly) notes.push('👨‍👩‍👧 Family-friendly');
      if (r.sustainability) notes.push('🌱 Sustainability feature');
      if (Array.isArray(r.features)) notes.push(`Features: ${(r.features as string[]).join(', ')}`);
      parts.push(`• **${r.name}** — ${r.zone} zone, ${r.level} level`);
      if (notes.length > 0) parts.push(`  ${notes.join(' | ')}`);
      parts.push('');
    }
    return parts.join('\n');
  },
  translateQuickPhrase: (res) => {
    return [
      `"${res.originalPhrase}" is typically said as:`,
      `**"${res.translatedPhrase}"**`,
      `*Pronunciation: ${res.pronunciation}*`
    ].join('\n');
  }
};

/**
 * Formats a tool result into a human-readable response string.
 *
 * @param toolResult - The tool result to format
 * @returns A formatted response string
 */
function matchFallbackFormatter(toolResult: Record<string, unknown>): string | null {
  if (toolResult.gate) return formatters.findGate(toolResult);
  if (toolResult.stepFree !== undefined) return formatters.getAccessibleRoute(toolResult);
  if (toolResult.density !== undefined) return formatters.getCrowdStatus(toolResult);
  if (toolResult.options) return formatters.getTransportOptions(toolResult);
  if (toolResult.results) return formatters.getAmenity(toolResult);
  if (toolResult.translatedPhrase) return formatters.translateQuickPhrase(toolResult);
  return null;
}

function formatToolResult(toolResult: Record<string, unknown>): string {
  if (toolResult.error) return String(toolResult.message ?? "Sorry, I couldn't find that information.");
  
  const name = toolResult.toolName as string | undefined;
  if (name && formatters[name]) return formatters[name](toolResult);

  const fallback = matchFallbackFormatter(toolResult);
  if (fallback) return fallback;

  return JSON.stringify(toolResult, null, 2);
}

/**
 * FallbackProvider — deterministic, rule-based AI provider.
 * Pattern-matches user messages to invoke tools and generate responses
 * without requiring any external API.
 */
async function* yieldWords(text: string): AsyncIterable<StreamChunk> {
  const words = text.split(' ');
  for (let i = 0; i < words.length; i++) {
    yield { type: 'text', content: (i === 0 ? '' : ' ') + words[i] };
  }
}

function getUnmatchedResponse(message: string, t: TranslationDictionary): string {
  const isGreeting = /\b(hi|hello|hey|howdy|good morning|good afternoon|good evening|hola|bonjour|مرحبا)\b/i.test(message);
  if (isGreeting) return t.ui.welcomeMessage;
  if (/\b(help|what can you do|menu|options)\b/i.test(message)) {
    return 'I can help you with:\n\n• 🚪 **Finding your gate** — tell me your section number\n• ♿ **Accessible routes** — step-free paths with ramps and elevators\n• 👥 **Crowd status** — check how busy gates and zones are\n• 🚌 **Transportation** — trains, buses, shuttles, and sustainable options\n• 🚻 **Amenities** — restrooms, first aid, prayer rooms, family rooms\n• 🌱 **Sustainability** — water refill stations, recycling hubs\n• 🌍 **Translation** — common fan phrases in English, Spanish, French, Arabic\n\nJust ask naturally and I\'ll help!';
  }
  return 'I\'m here to help with stadium navigation and services at MetLife Stadium for FIFA World Cup 2026. You can ask me about finding your gate, accessible routes, crowd levels, transportation, restrooms, and more. How can I assist you?';
}

export class FallbackProvider implements AIProvider {
  readonly name = 'fallback';

  isAvailable(): boolean {
    return true;
  }

  async *generateStream(options: GenerateOptions): AsyncIterable<StreamChunk> {
    const { message, sessionContext } = options;
    const t = getTranslations(sessionContext.language);

    const shouldAskAccessibility =
      !sessionContext.hasAskedAboutAccessibility &&
      !sessionContext.accessibilityMode &&
      options.history.length <= 2;

    let matched = false;
    for (const intent of intents) {
      const match = message.match(intent.pattern);
      if (match) {
        matched = true;
        const toolCall = intent.toolCall(match, message);

        if (toolCall) {
          yield { type: 'tool_call', toolCall };
          const toolResult = executeTool(toolCall, sessionContext.accessibilityMode);
          yield { type: 'tool_result', toolResult };

          const resultData = toolResult.result as Record<string, unknown>;
          resultData.toolName = toolResult.toolName;
          yield* yieldWords(formatToolResult(resultData));
        } else {
          yield* yieldWords(intent.fallbackResponse(match, message));
        }
        break;
      }
    }

    if (!matched) {
      yield* yieldWords(getUnmatchedResponse(message, t));
    }

    if (shouldAskAccessibility) {
      yield* yieldWords('\n\nBy the way, do you need accessible routing? I can find step-free paths with ramps and elevators. Just let me know or toggle the ♿ accessibility mode.');
    }

    yield { type: 'done' };
  }
}
